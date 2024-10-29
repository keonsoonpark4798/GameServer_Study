import { getProtoMessages } from '../../init/loadProtos.js';
import { getProtoTypeNameByHandlerId } from '../../handlers/index.js';
import { config } from '../../config/config.js';

export const packetParser = (data) => {
  const protoMessages = getProtoMessages();

  // 공통 패킷 구조를 디코딩
  const Packet = protoMessages.common.Packet;
  let packet;
  try {
    packet = Packet.decode(data);
  } catch (error) {
    console.error(error);
  }

  const handlerId = packet.handlerId;
  const userId = packet.userId;
  const clientVersion = packet.clientVersion;
  const sequence = packet.sequence;

  // clientVersion 검증
  if (clientVersion !== config.client.version) {
    console.error('클라이언트 버전이 일치하지 않습니다.');
  }

  // 핸들러 ID에 따라 적절한 payload 구조를 디코딩
  const protoTypeName = getProtoTypeNameByHandlerId(handlerId);
  if (!protoTypeName) {
    console.error(`알 수 없는 핸들러 ID: ${handlerId}`);
  }

  const [namespace, typeName] = protoTypeName.split('.');
  const PayloadType = protoMessages[namespace][typeName];
  let payload;

  payload = PayloadType.decode(packet.payload);

  // 필드 검증 추가
  const errorMessage = PayloadType.verify(payload);
  if (errorMessage) {
    console.error(`패킷 구조가 일치하지 않습니다: ${errorMessage}`);
  }

  // 필드가 비어 있거나, 필수 필드가 누락된 경우 처리
  const expectedFields = Object.keys(PayloadType.fields);
  const actualFields = Object.keys(payload);
  const missingFields = expectedFields.filter((field) => !actualFields.includes(field));
  if (missingFields.length > 0) {
    console.error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
  }

  return { handlerId, userId, payload, sequence };
};
