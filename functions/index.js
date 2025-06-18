const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const os = require('os');
const path = require('path');
const fs = require('fs');

admin.initializeApp();
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

exports.generateAudioPreview = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType || '';
  console.log('Triggered for file:', filePath, 'with contentType:', contentType);

  if (!filePath || !filePath.startsWith('submissions/') || !contentType.startsWith('audio/')) {
    console.log('Not a valid submissions audio file, exiting.');
    return null;
  }

  const bucket = admin.storage().bucket(object.bucket);
  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
  // We'll support both mp3 and wav outputs
  const baseName = path.basename(filePath, path.extname(filePath));
  const previewMp3Name = `${baseName}_30s.mp3`;
  const previewWavName = `${baseName}_30s.wav`;
  const tempPreviewMp3Path = path.join(os.tmpdir(), previewMp3Name);
  const tempPreviewWavPath = path.join(os.tmpdir(), previewWavName);

  // Download original file
  await bucket.file(filePath).download({ destination: tempFilePath });
  console.log('Downloaded original file.');

  // Try to generate both MP3 and WAV previews for debugging
  let mp3Success = false, wavSuccess = false;

  // MP3 Preview
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .setStartTime(0)
        .duration(30)
        .audioCodec('libmp3lame')
        .format('mp3')
        .output(tempPreviewMp3Path)
        .on('end', () => {
          console.log('MP3 preview generated at', tempPreviewMp3Path);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error generating MP3 preview:', err);
          reject(err);
        })
        .run();
    });
    // Check file size
    const mp3Stats = fs.statSync(tempPreviewMp3Path);
    console.log('MP3 preview file size:', mp3Stats.size);
    if (mp3Stats.size > 1000) mp3Success = true;
  } catch (err) {
    console.error('MP3 preview failed:', err);
  }

  // WAV Preview
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .setStartTime(0)
        .duration(30)
        .audioCodec('pcm_s16le')
        .format('wav')
        .output(tempPreviewWavPath)
        .on('end', () => {
          console.log('WAV preview generated at', tempPreviewWavPath);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error generating WAV preview:', err);
          reject(err);
        })
        .run();
    });
    const wavStats = fs.statSync(tempPreviewWavPath);
    console.log('WAV preview file size:', wavStats.size);
    if (wavStats.size > 1000) wavSuccess = true;
  } catch (err) {
    console.error('WAV preview failed:', err);
  }

  // Choose which version to upload (prefer MP3, fallback to WAV)
  let previewPathToUpload = null, previewStoragePath = null, previewContentType = null;
  if (mp3Success) {
    previewPathToUpload = tempPreviewMp3Path;
    previewStoragePath = filePath.replace(/^submissions\//, 'previews/').replace(path.extname(filePath), '_30s.mp3');
    previewContentType = 'audio/mpeg';
    console.log('Uploading MP3 preview...');
  } else if (wavSuccess) {
    previewPathToUpload = tempPreviewWavPath;
    previewStoragePath = filePath.replace(/^submissions\//, 'previews/').replace(path.extname(filePath), '_30s.wav');
    previewContentType = 'audio/wav';
    console.log('Uploading WAV preview...');
  } else {
    console.error('Both MP3 and WAV preview generation failed.');
    try { fs.unlinkSync(tempFilePath); } catch (e) {}
    return null;
  }

  // Upload preview to storage
  await bucket.upload(previewPathToUpload, {
    destination: previewStoragePath,
    metadata: { contentType: previewContentType }
  });
  console.log('Uploaded preview to', previewStoragePath);

  // Get signed URL
  const [url] = await bucket.file(previewStoragePath).getSignedUrl({
    action: 'read',
    expires: '03-09-2491'
  });
  console.log('Generated signed URL:', url);

  // Parse queueType and originalName
  const pathParts = filePath.split('/');
  if (pathParts.length < 3) {
    console.error('Path does not have enough parts:', filePath);
    try {
      fs.unlinkSync(tempFilePath);
      if (fs.existsSync(tempPreviewMp3Path)) fs.unlinkSync(tempPreviewMp3Path);
      if (fs.existsSync(tempPreviewWavPath)) fs.unlinkSync(tempPreviewWavPath);
    } catch (e) {}
    return null;
  }
  const queueType = pathParts[1];
  const fileNameWithTimestamp = pathParts[2];
  const originalName = fileNameWithTimestamp.replace(/^\d+_/, '');

  console.log('Looking for Firestore doc: queueType:', queueType, 'originalName:', originalName);

  // Query Firestore
  const itemsRef = admin.firestore().collection('queues').doc(queueType).collection('items');
  const snapshot = await itemsRef.where('originalName', '==', originalName)
    .orderBy('enqueuedAt', 'desc')
    .limit(1)
    .get();
  console.log('Query snapshot size:', snapshot.size);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    console.log('Updating doc:', doc.ref.path);
    await doc.ref.update({ previewUrl: url });
    console.log('Updated Firestore doc with previewUrl.');
  } else {
    console.error('No matching Firestore doc found for originalName:', originalName);
  }

  // Cleanup
  try { fs.unlinkSync(tempFilePath); } catch (e) {}
  try { if (fs.existsSync(tempPreviewMp3Path)) fs.unlinkSync(tempPreviewMp3Path); } catch (e) {}
  try { if (fs.existsSync(tempPreviewWavPath)) fs.unlinkSync(tempPreviewWavPath); } catch (e) {}

  return null;
});