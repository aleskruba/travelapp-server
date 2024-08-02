const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { promisify } = require('util');
const redis = require('redis');


let redisClient = redis.createClient({
  //  host: '127.0.0.1',
    host:'red-cq0mg1iju9rs73avmd4g',
    port: 6379,

});



module.exports.getMessages = async (req, res) => {
    const countryId = req.params.id;


    try {
        const messages = await prisma.message.findMany({
            where: {
                country: countryId
            },
            include: {
                user: true, // Include the user who posted the message
                reply: {    // Include replies to the message
                    include: {
                        user: true // Include the user who posted the reply
                    }
                }
            }
        });
   
        res.status(200).json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};

module.exports.postMessage = async (req, res) => {
    const  message  = req.body;
    const user = req.user;
    const userId = user.id;
  
    console.log('message:', message);
    console.log('userId:', userId);
  
    try {

      if (!message.message.trim().length) {
        return res.status(403).json({ error: 'Žádný text' });
      }
  
      if (message.message.length > 400) {
        return res.status(403).json({ error: 'Příliš dlouhý text, max 400 znaků' });
      }
  
      if (userId !== message.user_id) {
        return res.status(401).json({ error: 'Unauthorized User' });
      }
  
      // Create new message in the database using Prisma
      const newMessage = await prisma.message.create({
        data: {
          message: message.message,
          country: message.country,
          user_id: userId,
        },
      });
  
      res.status(201).json({ message: newMessage });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
  };



  

  module.exports.deleteMessage = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id;
  
  
    try {
      const message = await prisma.message.findUnique({
        where: {
          id: Number(id),
        },
      });
  
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
  
      if (message.user_id !== userId) {
        return res.status(403).json({ error: 'You are not authorized to delete this message' });
      }
  
      await prisma.message.delete({
        where: {
          id: Number(id),
        },
      });
  
      res.status(201).json({ message: 'Message was deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  };


  

  module.exports.deleteReply = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id;
  
  
    try {
      const message = await prisma.reply.findUnique({
        where: {
          id: Number(id),
        },
      });
  
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
  
      if (message.user_id !== userId) {
        return res.status(403).json({ error: 'You are not authorized to delete this message' });
      }
  
      await prisma.reply.delete({
        where: {
          id: Number(id),
        },
      });
  
      res.status(201).json({ message: 'Message was deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  };