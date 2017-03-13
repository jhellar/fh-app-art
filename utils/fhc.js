"use strict";

const fh = require('fh-fhc');

function init(host, username, password) {
  var cfg = {
    loglevel: 'error',
    json: true,
    feedhenry: host,
    user: username,
    inmemoryconfig: true
  };

  return new Promise(function(resolve, reject) {
    fh.load(cfg, function(err) {
      if (err) {
        return reject(err);
      }
      fh.target({_:[host]}, function(err) {
        if (err) {
          return reject(err);
        }
        fh.login({_:[username, password]}, function(err) {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  });
}

function appDeploy(appGuid, env) {
  return new Promise(function(resolve, reject) {
    fh.app.stage({app: appGuid, env: env}, function(error, startRes) {
      if (error) {
        return reject(error);
      }

      resolve(startRes);
    });
  });
}

function appImport(projectId, title, type, source, env) {
  return new Promise(function(resolve, reject) {
    fh.import({_: [projectId, title, type,
      source, '--env=' + env]}, function(error, importRes) {
      if (error) {
        return reject(error);
      }

      resolve(JSON.parse(importRes));
    });
  });
}

function connectionUpdate(projectId, connectionId, cloudAppId, env) {
  return new Promise(function(resolve, reject) {
    fh.connections({_: ['update', projectId, connectionId,
      cloudAppId, '--env=' + env]}, function(error, updateRes) {
      if (error) {
        return reject(error);
      }

      resolve(updateRes);
    });
  });
}

function connectionsList(projectId) {
  return new Promise(function(resolve, reject) {
    fh.connections({_: ['list', projectId]}, function(error, connections) {
      if (error) {
        return reject(error);
      }

      resolve(connections);
    });
  });
}

function policyCreate(policyId, policyType, configurations, checkUserExists, checkUserApproved) {
  return new Promise(function(resolve, reject) {
    fh['admin-policies']({_: ['create', policyId, policyType, configurations,
      checkUserExists, checkUserApproved]}, function(error, policy) {
      if (error) {
        return reject(error);
      }

      resolve(policy);
    });
  });
}

function policyDelete(guid) {
  return new Promise(function(resolve, reject) {
    fh['admin-policies']({_:['delete', guid]}, function(err) {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
}

function projectsList() {
  return new Promise((resolve, reject) => {
    fh.projects({_:['list']}, (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    });
  });
}

function projectsListNoApps() {
  return new Promise((resolve, reject) => {
    fh.call({_:['/box/api/projects?apps=false']}, (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    });
  });
}

function projectRead(guid) {
  return new Promise(function(resolve, reject) {
    try {
      fh.projects({_:['read', guid]}, function(err, result) {
        if (err) {
          return reject(err);
        }

        resolve(result);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function projectCreate(name, templateId) {
  return new Promise(function(resolve, reject) {
    fh.projects({_:['create', name, templateId]}, function(err, result) {
      if (err) {
        return reject(err);
      }

      resolve(result);
    });
  });
}

function projectDelete(guid) {
  return new Promise(function(resolve, reject) {
    fh.projects({_:['delete', guid]}, function(err) {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
}

function secureEndpoints(appGuid, security, env) {
  return new Promise(function(resolve, reject) {
    fh.secureendpoints({_: ['set-default', appGuid, security], env: env}, function(error, res) {
      if (error) {
        return reject(error);
      }

      resolve(res);
    });
  });
}

function environmentRead(id) {
  return new Promise(function(resolve, reject) {
    fh.admin.environments.read({id: id}, function(error, res) {
      if (error) {
        return reject(error);
      }

      resolve(res);
    });
  });
}

function serviceCreate(name, templateId) {
  return new Promise(function(resolve, reject) {
    fh.services({_:['create', name, templateId]}, function(error, res) {
      if (error) {
        return reject(error);
      }

      resolve(res);
    });
  });
}

function servicesList() {
  return new Promise(function(resolve, reject) {
    fh.services({_:['list']}, function(error, res) {
      if (error) {
        return reject(error);
      }

      resolve(res);
    });
  });
}

module.exports = {
  init: init,
  appDeploy: appDeploy,
  appImport: appImport,
  connectionUpdate: connectionUpdate,
  connectionsList: connectionsList,
  policyCreate: policyCreate,
  policyDelete: policyDelete,
  projectsList: projectsList,
  projectsListNoApps: projectsListNoApps,
  projectRead: projectRead,
  projectCreate: projectCreate,
  projectDelete: projectDelete,
  secureEndpoints: secureEndpoints,
  environmentRead: environmentRead,
  serviceCreate: serviceCreate,
  servicesList: servicesList
};
