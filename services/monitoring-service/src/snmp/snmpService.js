const snmp = require("net-snmp");

function getUptime(ip, community = "public") {
  return new Promise((resolve) => {
    const session = snmp.createSession(ip, community, {
      timeout: 2000
    });

    const oid = "1.3.6.1.2.1.1.3.0";

    let closed = false;

    function safeClose() {
      if (!closed) {
        try {
          session.close();
        } catch (e) {}
        closed = true;
      }
    }

    session.get([oid], (err, varbinds) => {
      if (err || !varbinds || !varbinds[0]) {
        safeClose();
        return resolve(null);
      }

      const ticks = varbinds[0].value;
      const seconds = Math.floor(ticks / 100);

      safeClose();
      resolve(seconds);
    });
  });
}

module.exports = { getUptime };