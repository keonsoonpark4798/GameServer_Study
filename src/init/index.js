import { loadGameAssets } from './assets.js';
import { loadProtos } from './loadProtos.js';

const initServer = async () => {
  try {
    await loadProtos();
    await loadGameAssets();
  } catch (e) {
    console.error(e);
    process.exit(1); // 오류 발생 시 프로세스 종료
  }
};

export default initServer;
