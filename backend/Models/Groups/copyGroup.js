/* eslint-disable no-undef */
const { pool } = require('../db');
/**
  * @param {Object} param0
  * @param {String} param0.username
  * @param {String} param0.newName
 `* @param {String} param0.name
  * @return {Promise}
*/
function copyGroup({ username, description, confidential, newName, name }) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function(error, connection) {
      if (error) {
        reject(error);
      }
      connection.beginTransaction(function(error) {
        if (error) {
          reject(error);
        }
        connection.query(
          `INSERT INTO groups(name,description,confidential,created_by) VALUES (?,?,?,?) WHERE
                  (SELECT COUNT(username) FROM users WHERE (username=? AND admin=1) `,
          [newName, description, confidential, username, username],
          async (error, results) => {
            if (error) {
              reject(error);
              connection.rollback(function() {
                connection.release();
              });
              return;
            }
            let xy = new Promise(function(resolve, reject) {
              connection.query(
                'INSERT INTO UserGroups(`username`,`group_id`,`admin`)' +
                  'VALUES(?,?,?)',
                [username, results.insertId, 1],
                error => {
                  if (error) {
                    reject(error);
                    return;
                  }
                }
              );
            });
            try {
              await xy;
            } catch (e) {
              connection.rollback(function() {
                connection.release();
                reject(e);
              });
              error1 = true;
            }
            if (error1) {
              return;
            }
            let insertion = new Promise(function(resolve, reject) {
              connection.query(
                `CREATE TEMPORARY TABLE tmptable SELECT * FROM UserGroups WHERE group_id = (SELECT count(id),name FROM groups WHERE name=?);
                  UPDATE tmptable SET group_id = ? WHERE group_id = (SELECT count(id),name FROM groups WHERE name=?) ;
                  INSERT INTO UserGroups SELECT * FROM tmptable WHERE group_id =  ? ;`,
                [name, results.insertId, name, results.insertId],
                error => {
                  if (error) {
                    reject(error);
                    return;
                  }
                }
              );
            });
            try {
              await insertion;
            } catch (e) {
              connection.rollback(function() {
                connection.release();
                reject(e);
              });
              error2 = true;
            }
            if (error2) {
              return;
            }
            connection.commit(function(error) {
              connection.release();
              if (error) {
                reject(error);
                return;
              }
              resolve({ id: idProduct });
            });
          }
        );
      });
    });
  });
}
module.exports = copyGroup;
