const snmp = require("net-snmp");

function getInterfaceSpeed(ip, ifaceIndex, community = "public") {
  return new Promise((resolve) => {
    const session = snmp.createSession(ip, community, { timeout: 2000 });

    const oid = `1.3.6.1.2.1.2.2.1.5.${ifaceIndex}`;

    session.get([oid], (err, varbinds) => {
      if (err || !varbinds || !varbinds[0]) {
        session.close();
        return resolve(null);
      }

      const speedBps = varbinds[0].value; // bits per second
      session.close();
      resolve(speedBps);
    });
  });
}

module.exports = { getInterfaceSpeed };
