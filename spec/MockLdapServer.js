const ldapjs = require('ldapjs');

function newServer(port, dn, provokeSearchError = false) {
  const server = ldapjs.createServer();

  server.bind('o=example', function(req, res, next) {
    if (req.dn.toString() !== dn || req.credentials !== 'secret')
      return next(new ldapjs.InvalidCredentialsError());
    res.end();
    return next();
  });

  server.search('o=example', function(req, res, next) {
    if (provokeSearchError) {
      res.end(ldapjs.LDAP_SIZE_LIMIT_EXCEEDED);
      return next(new ldapjs.NoSuchObjectError('fake error'));
    }
    const obj = {
      dn: req.dn.toString(),
      attributes: {
        objectclass: ['organization', 'top'],
        o: 'example',
      },
    };

    const group = {
      dn: req.dn.toString(),
      attributes: {
        objectClass: ['groupOfUniqueNames', 'top'],
        uniqueMember: ['uid=testuser, o=example'],
        cn: 'powerusers',
        ou: 'powerusers',
      },
    };

    if (req.filter.matches(obj.attributes)) {
      res.send(obj);
    }

    if (req.filter.matches(group.attributes)) {
      res.send(group);
    }
    res.end();
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

module.exports = newServer;
