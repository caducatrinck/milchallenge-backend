const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    req.usuario = jwt.verify(token, process.env.JWT_KEY);
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).send({ mensagem: "Falha na autenticação" });
  }
};
