const jwt = require('jsonwebtoken');
const Secret = require('../model/Secret')

const listAllPswHandler = async (req, res) => {
  let uname = req.params.uname;
  let fromUser = req.user;

  if(uname != fromUser) {
    return res.sendStatus(403);
  }

  let allPsws = await Secret.find({username: uname}).exec();

  res.json(allPsws);
}

const getPswHandler = async (req, res) => {
  let uname = req.params.uname;
  let secretName = req.params.secretName;
  let fromUser = req.user;

  if(uname != fromUser) {
    return res.sendStatus(403);
  }

  try {
    let psw = await Secret.findOne({username: uname, secretName: secretName}).exec();

    if(!psw) {
      res.json(
        {
          message: 'password not found'
        }
      );
      res.status(400);
      return;
    }

    res.status(201);
    res.json(psw);
  } catch (err) {
    res.status(500);
    res.json({message: err.message});
  }
}

const deletePswHandler = async (req, res) => {
  let uname = req.params.uname;
  let secretName = req.params.secretName;
  let fromUser = req.user;

  if(uname != fromUser) {
    return res.sendStatus(403);
  }

  try {
    let psw = await Secret.findOne({username: uname, secretName: secretName}).exec();

    if(!psw) {
      res.json(
        {
          message: 'password not found'
        }
      );
      res.status(400);
      return;
    }

    const result = await Secret.deleteOne({username: uname, secretName: secretName}).exec();

    res.status(203);
    res.json({message: result});
  } catch (err) {
    res.status(500);
    res.json({message: err.message});
  }
}

const updatePswHandler = async (req, res) => {
  let uname = req.params.uname;
  let secretName = req.params.secretName;
  let fromUser = req.user;

  if(uname != fromUser) {
    return res.sendStatus(403);
  }

  try {
    // let psw = await Secret.findOne({username: uname, secretName: req.body.secretName}).exec();

    // if(!psw) {
    //   res.json(
    //     {
    //       message: 'password not found'
    //     }
    //   );
    //   res.status(400);
    //   return;
    // }

    const filter = {username: uname, secretName: secretName};
    const updateBody = {...req.body};
    updateBody.strict = false;
    console.log('updating now')
    console.log(updateBody)
    const doc = await Secret.findOneAndUpdate(filter, updateBody);
    console.log('done updating')
    if(!doc) {
      res.json(
        {
          message: 'password not found'
        }
      );
      res.status(400);
      return;
    }
    res.status(200).json({message: 'update successful!'});
  } catch (err) {
    res.status(500);
    res.json({message: err.message});
  }
}

const createPswHandler = async (req, res) => {
  let uname = req.params.uname;
  let fromUser = req.user;

  if(uname != fromUser) {
    res.json({message: `${uname} and ${fromUser} don't match!`});
    res.status(403);
    return;
  }

  let body = {...req.body}

  let findPsw = await Secret.findOne({username: uname, secretName: body.secretName}).exec();

  if(findPsw) {
    // res.
    res.json({message: "password already exists"});
    res.status(400);
    return;
  }

  try {
    const result = await Secret.create({
      username: uname,
      secretName: body.secretName,
      secrets: {
        username: body.secrets.username,
        password: body.secrets.password
      }
    })

    console.log(result);

    res.status(201).json({
      'success': `New password ${body.secretName} created for ${uname}!`
    })
  } catch (err) {
    res.status(500).json({
      'message': err.message
    })
  }
  
}

module.exports = {listAllPswHandler, createPswHandler, updatePswHandler, getPswHandler, deletePswHandler};
