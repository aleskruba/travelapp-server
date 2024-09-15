const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


module.exports.getMessages = async (req, res) => {
  const countryId = req.params.id;

  const page = parseInt(req.query.page) ;  // Get the page number from query parameters, default to 1
  const limit = 4;  // Number of items per page
  const offset = (page - 1) * limit;  // Calculate the offset



  try {
      const messages = await prisma.message.findMany({
          where: {
              country: countryId
          },
          include: {
              user: true, // Include the user who posted the message
              reply: {  
                  include: {
                      user: true, // Include the user who posted the reply
                      votesreply: true, // Include the votes on replies
                  }
              },
              votes: {  
                include: {
                    message:true
                }
            }
          },
          orderBy: {
              id: 'desc'  // Sort by creation date in descending order
          },
          skip: offset, // Skip the number of items for pagination
          take: limit,  // Limit the number of items per page
      });
 
      const totalMessages = await prisma.message.count({
        where: {
          country: countryId
        },
      });
      
      const totalPages = Math.ceil(totalMessages / limit);
    //  console.log(messages.length , ' totalPages:',totalPages, 'currentPage:',page )
      res.status(200).json({
          messages,
          totalPages,
       /*    currentPage: page */
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
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


  module.exports.postReply = async (req, res) => {
    const message  = req.body;
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
      const newMessage = await prisma.reply.create({
        data: {
          message: message.message,
          message_id: message.message_id,
          user_id: userId,
        },
      });
  
      res.status(201).json({ message: newMessage });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Chyba server neodpovidá' });
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

module.exports.voteMessage = async (req, res) => {
  const data = req.body; // data.message_id and data.voteType
  const user = req.user;
  const userId = user.id;

  try {
    // Check if a vote from this user for this message already exists
    const existingVote = await prisma.votes.findFirst({
      where: {
        message_id: data.message_id,
        user_id: userId,
      },
    });

    if (existingVote) {
      // If the vote type is the same, return an error
      if (data.voteType === existingVote.vote_type) {
        return res.status(403).json({ error: 'You can only give one vote to one message' });
      } else {
        // Otherwise, update the existing vote with the new vote type
        await prisma.votes.update({
          where: {
            id: existingVote.id,
          },
          data: {
            vote_type: data.voteType,
          },
        });
        return res.status(200).json({ message: 'Vote was updated' });
      }
    } else {
      // Create a new vote
      await prisma.votes.create({
        data: {
          user_id: userId,
          message_id: data.message_id,
          vote_type: data.voteType,
        },
      });
      return res.status(201).json({ message: 'Vote was created' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};


module.exports.voteReply = async (req, res) => {
  const data = req.body; // data.message_id and data.voteType
  const user = req.user;
  const userId = user.id;

  try {
    // Check if a vote from this user for this message already exists
    const existingVote = await prisma.votesreply.findFirst({
      where: {
        reply_id: data.reply_id,
        message_id: data.message_id,
        user_id: userId,
      },
    });

    if (existingVote) {
      // If the vote type is the same, return an error
      if (data.voteType === existingVote.vote_type) {
        return res.status(403).json({ error: 'You can only give one vote to one message' });
      } else {
        // Otherwise, update the existing vote with the new vote type
        await prisma.votesreply.update({
          where: {
            id: existingVote.id,
          },
          data: {
            vote_type: data.voteType,
          },
        });
        return res.status(200).json({ message: 'Vote was updated' });
      }
    } else {
      // Create a new vote
      await prisma.votesreply.create({
        data: {
          user_id: userId,
          reply_id:data.reply_id,
          message_id: data.message_id,
          vote_type: data.voteType,
        },
      });
      return res.status(201).json({ message: 'Vote was created' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
