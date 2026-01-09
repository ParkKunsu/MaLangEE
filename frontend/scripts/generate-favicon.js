const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../public/images/mascot.svg');
const outputPath = path.join(__dirname, '../public/favicon.ico');

// SVG를 ICO 파일로 변환
// ICO 파일은 256x256 크기로 생성
sharp(inputPath)
  .resize(256, 256, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 }
  })
  .toFile(outputPath)
  .then(() => {
    console.log(`favicon.ico가 성공적으로 생성되었습니다: ${outputPath}`);
  })
  .catch(err => {
    console.error('favicon.ico 생성 중 오류가 발생했습니다:', err);
    process.exit(1);
  });

