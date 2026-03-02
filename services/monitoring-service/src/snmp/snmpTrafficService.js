const snmp = require("net-snmp");

function getInterfaceOctets(ip, ifaceIndex, community = "public") {
  return new Promise((resolve) => {
    const session = snmp.createSession(ip, community, { timeout: 2000 });

    const oids = [
      `1.3.6.1.2.1.2.2.1.10.${ifaceIndex}`, // ifInOctets
      `1.3.6.1.2.1.2.2.1.16.${ifaceIndex}`  // ifOutOctets
    ];

    session.get(oids, (err, varbinds) => {
      session.close();

      if (err || !varbinds) {
        return resolve(null);
      }

      resolve({
        inOctets: Number(varbinds[0].value),
        outOctets: Number(varbinds[1].value)
      });
    });
  });
}

module.exports = { getInterfaceOctets };
