const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { encrypt, decrypt } = require('../utils/encryptionUtils');
module.exports.getTourMessages = async (req, res) => {
  const tourID = req.params.id;
  const user = req.user;
  const page = parseInt(req.query.page) ;  // Get the page number from query parameters, default to 1
  const limit = 4;  // Number of items per page
  const offset = (page - 1) * limit;  // Calculate the offset

  try {
      const getAlltourmessages = await prisma.tourmessage.findMany({
          where: {
              tour_id: parseInt(tourID)   
          },
          include: {
              user: true, // Include the user who posted the message
              tourreply: {  
                  include: {
                      user: true // Include the user who posted the reply
                  }
              }
          },
          orderBy: {
              id: 'desc'  // Sort by creation date in descending order
          },
          skip: offset, // Skip the number of items for pagination
          take: limit,  // Limit the number of items per page
      });

      const totalMessages = await prisma.tourmessage.count({
        where: {
          tour_id: parseInt(tourID)
        },
      });

      const tourmessages = getAlltourmessages.map((message) => {
        // Filter the replies based on the user ID and message type
        const filteredReplies = message.tourreply.map((reply) => {
          if (reply.messagetype === 1) {
            // Decrypt the message if it's private
            try {
              reply.message = decrypt(reply.message); // Decrypt the message
            } catch (error) {
              console.error('Decryption failed for reply:', reply.message, error);
              reply.message = 'Decryption Error'; // Handle the error gracefully
            }

            if (reply.user_id === user.id || message.user.id == user.id) {
              return reply;
            } else {
              // You can return null or a placeholder if the message shouldn't be shown
              return null;
            }
          } else {
            // Return public messages as they are
            return reply;
          }
        }).filter((reply) => reply !== null); // Remove null replies
        
        // Return the message with the filtered replies
        return {
          ...message,
          tourreply: filteredReplies
        };
      });
      
      const totalPages = Math.ceil(totalMessages / limit);
      res.status(200).json({
          tourmessages,
          totalPages,
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
  }
};

module.exports.postTourMessage = async (req, res) => {
  const  message  = req.body;
  const user = req.user;
  const userId = user.id;
  const tourID = req.params.id;


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
    const newMessage = await prisma.tourmessage.create({
      data: {
        message: message.message,
        user_id: userId,
        tour_id: parseInt(tourID)
      },
    });

    res.status(201).json({ message: newMessage });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba server neodpovidá' });
  }
};



module.exports.deleteTourMessage = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const userId = user.id;


  try {
    const message = await prisma.tourmessage.findUnique({
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

    await prisma.tourmessage.delete({
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


module.exports.postTourReply = async (req, res) => {
  const message  = req.body;
  const user = req.user;
  const userId = user.id;



  const encryptedMessage = encrypt(message.message);
 
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
    const newMessage = await prisma.tourreply.create({
      data: {
        message: message.isPrivate === 1 ? encryptedMessage : message.message,
        tourmessage_id	: message.message_id,
        messagetype:message.isPrivate,
        user_id: userId,
      },
    });

    res.status(201).json({ message: newMessage});

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba server neodpovidá' });
  }
};



module.exports.deleteTourReply = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const userId = user.id;


  try {
    const message = await prisma.tourreply.findUnique({
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

    await prisma.tourreply.delete({
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
