let io = null;

function setSocket(serverIo) {
  io = serverIo;
}

function getSocket() {
  return io;
}

module.exports = { setSocket, getSocket };