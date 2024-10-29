import { config } from '../config/config.js';
import { PACKET_TYPE, TOTAL_LENGTH } from '../constants/header.js';
import { packetParser } from '../utils/parser/packetParser.js';
import { getHandlerById } from '../handlers/index.js';
import { getUserById } from '../session/user.session.js';

export const onData = (socket) => async (data) => {
  // 기존 버퍼에 새로 수신된 데이터를 추가
  socket.buffer = Buffer.concat([socket.buffer, data]);

  // 패킷의 총 헤더 길이 (패킷 길이 정보 + 타입 정보)
  const totalHeaderLength = config.packet.totalLength + config.packet.typeLength;

  // 버퍼에 최소한 전체 헤더가 있을 때만 패킷을 처리
  while (socket.buffer.length >= totalHeaderLength) {
    // 1. 패킷 길이 정보 수신 (4바이트)
    const length = socket.buffer.readUInt32BE(0);

    // 2. 패킷 타입 정보 수신 (1바이트)
    const packetType = socket.buffer.readUInt8(TOTAL_LENGTH);
    // 3. 패킷 전체 길이 확인 후 데이터 수신
    if (socket.buffer.length >= length) {
      // 패킷 데이터를 자르고 버퍼에서 제거
      const packet = socket.buffer.slice(totalHeaderLength, length);
      socket.buffer = socket.buffer.slice(length);

      console.log(`length: ${length}`);
      console.log(`packetType: ${packetType}`);

      switch (packetType) {
        case PACKET_TYPE.PING:
          break;
        case PACKET_TYPE.NORMAL:
          const { handlerId, sequence, payload, userId } = packetParser(packet);

          const user = getUserById(userId);
          // 유저가 접속해 있는 상황에서 시퀀스 검증
          if (user && user.sequence !== sequence) {
            console.error('잘못된 호출 값입니다.');
          }

          const handler = getHandlerById(handlerId);
          await handler({
            socket,
            userId,
            payload,
          });
      }
    } else {
      // 아직 전체 패킷이 도착하지 않음
      break;
    }
  }
};
