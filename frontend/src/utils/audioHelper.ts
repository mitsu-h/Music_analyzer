import axios from "axios";

// Fetch separated audio files and return their ArrayBuffer
export async function fetchSeparatedAudioFiles(separated_audio_files: Record<string, string>) {
  const response = await axios.get("http://localhost:8081/api/get_audio_file/", {
    params: {
      separated_audio_files: separated_audio_files,
    },
  });
  const data = response.data;

  const arrayBuffers: Record<string, ArrayBuffer> = {};
  for (const key in data) {
    const base64Data = data[key];
    const binaryData = atob(base64Data);
    const len = binaryData.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    arrayBuffers[key] = bytes.buffer;
  }

  return arrayBuffers;
}

// 音源データをミックスする関数
export async function mixAudioBuffers(audioDataList, audioContext) {
    const numChannels = 2; // ステレオ
    const mixedBuffer = audioContext.createBuffer(numChannels, audioDataList[0].length, audioContext.sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const mixedBufferData = mixedBuffer.getChannelData(channel);
  
      for (const audioData of audioDataList) {
        const channelData = audioData.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          mixedBufferData[i] += channelData[i];
        }
      }
    }
  
    return mixedBuffer;
  }

  function writeWavHeader(buffer, sampleRate, numChannels, dataSize) {
    const view = new DataView(buffer);
  
    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
  
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
  
    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);
  }
  
  

export function audioBufferToBlob(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2;
    const dataSize = length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const data = new DataView(buffer);
  
    writeWavHeader(buffer, audioBuffer.sampleRate, numberOfChannels, dataSize);
  
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      let offset = 44 + channel * 2;
  
      for (let i = 0; i < channelData.length; i++) {
        const value = channelData[i] * 0x7fff; // convert to 16-bit value
        data.setInt16(offset, value, true);
        offset += numberOfChannels * 2;
      }
    }
  
    return new Blob([data], { type: "audio/wav" });
  }
  
  
  
  // 音源データを再生する関数
  export function playAudioBuffer(audioBuffer, audioContext) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  }