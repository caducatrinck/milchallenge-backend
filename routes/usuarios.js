const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const login = require("../middleware/login");

router.post("/cadastro", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [req.body.email],
      (error, results) => {
        if (error) {
          return res.status(500).send({ error: error });
        }
        if (results.length > 0) {
          res.status(409).send({ mensagem: "Usuário já cadastrado" });
        } else {
          bcrypt.hash(req.body.senha, 6, (errBcrypt, hash) => {
            if (errBcrypt) {
              return res.status(500).send({ error: errBcrypt });
            }
            conn.query(
              `INSERT INTO usuarios (email, senha) VALUES (?,?)`,
              [req.body.email, hash],
              (error, results) => {
                conn.release();
                if (error) {
                  return res.status(500).send({ error: error });
                }
                response = {
                  mensagem: "Usuário criado com sucesso",
                  usuarioCriado: {
                    id: results.insertId,
                    email: req.body.email,
                  },
                };
                return res.status(201).send(response);
              }
            );
          });
        }
      }
    );
  });
});

router.post("/", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    const query = `SELECT * FROM usuarios WHERE email = ?`;
    conn.query(query, [req.body.email], (error, results, fields) => {
      conn.release();
      if (error) {
        return res.status(500).send({ error: error });
      }
      if (results.length < 1) {
        return res.status(401).send({ mensagem: "Falha na autenticação" });
      }
      bcrypt.compare(req.body.senha, results[0].senha, (err, result) => {
        if (err) {
          return res.status(401).send({ mensagem: "Senha incorreta" });
        }
        if (result) {
          const token = jwt.sign(
            {
              id: results[0].idUsuario,
              email: results[0].email,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "30m",
            }
          );
          return res.status(200).send({ token });
        }
        return res.status(401).send({ mensagem: "Falha na autenticação" });
      });
    });
  });
});

const { getClientIp } = require("@supercharge/request-ip");
router.get("/home", login, (req, res, next) => {
  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(req);
  return res.send({ ip: getClientIp(req) });
});

router.get("/auth", login, (req, res, next) => {
  return res.send({ mensagem: "Você está Logado" });
});

module.exports = router;
