const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


module.exports.getVlogs = async (req, res) => {
    const countryId = req.params.id;
    const page = parseInt(req.query.page) ;  // Get the page number from query parameters, default to 1
    const limit = 6;  // Number of items per page
    const offset = (page - 1) * limit;  // Calculate the offset

    try {
        const vlogs = await prisma.video.findMany({
            where: {
                country: countryId
            },
            include: {
                user: true, // Include the user who posted the message
            
            },
                 orderBy: {
                id: 'desc'  // Sort by creation date in descending order
            },
            skip: offset, // Skip the number of items for pagination
            take: limit, 
        });

         
      const totalVlogs = await prisma.video.count({
        where: {
          country: countryId
        },
      });
      
      const totalPages = Math.ceil(totalVlogs / limit);
   
      res.status(200).json({
        vlogs,
        totalPages,
        currentPage: page
    })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};



module.exports.postVlog = async (req, res) => {
  const vlog  = req.body;
  const user = req.user;
  const userId = user.id;

  try {

    if (!vlog.title.trim().length) {
      return res.status(403).json({ error: 'Žádný text' });
    }

    if (vlog.title.length > 150) {
      return res.status(403).json({ error: 'Příliš dlouhý text, max 400 znaků' });
    }

    if (!vlog.video.trim().length) {
      return res.status(403).json({ error: 'Žádný text' });
    }

    if (vlog.video.length > 15) {
      return res.status(403).json({ error: 'Příliš dlouhý text, max 15 znaků' });
    }

    if (userId !== vlog.user_id) {
      return res.status(401).json({ error: 'Unauthorized User' });
    }


   const newvlog = await prisma.video.create({
      data: {
        title: vlog.title,
        video: `https://www.youtube.com/embed/${vlog.video}`,
        country: vlog.country,
        user_id: userId,
      },
    }); 


    res.status(200).json({ message: 'success' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba server neodpovidá' });
  }
};



  

module.exports.deleteVlog = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const userId = user.id;


  try {
    const vlog = await prisma.video.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!vlog) {
      return res.status(404).json({ error: 'Vlog not found' });
    }

    if (vlog.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this vlog' });
    }

    await prisma.video.delete({
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



module.exports.updateVlog = async (req, res) => {
  const { id } = req.params;
  const vlog = req.body;
  const user = req.user;
  const userId = user.id;


  try {
    // Ensure vlog exists and is valid
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid Vlog ID' });
    }

    // Validation: Check title and video content
    if (!vlog.title.trim().length) {
      return res.status(403).json({ error: 'Title cannot be empty' });
    }

    if (vlog.title.length > 150) {
      return res.status(403).json({ error: 'Title too long, max 150 characters' });
    }

    if (!vlog.video.trim().length) {
      return res.status(403).json({ error: 'Video cannot be empty' });
    }

    if (vlog.video.length > 15) {
      return res.status(403).json({ error: 'Video ID too long, max 15 characters' });
    }


    const existingVlog = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingVlog) {
      return res.status(404).json({ error: 'Vlog not found' });
    }

    // Update vlog
    const updatedVlog = await prisma.video.update({
      where: { id: parseInt(id) },
      data: {
        title: vlog.title,
        video: `https://www.youtube.com/embed/${vlog.video}`,
      },
    });

    res.status(200).json({ message: 'Success', updatedVlog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};


module.exports.getYourVlogs = async (req, res) => {
  const page = parseInt(req.query.page) ; 
  const limit = 8; 
  const offset = (page - 1) * limit;  
  const user = req.user;
  const userId = user.id;

  try {

    const vlogs = await prisma.video.findMany({
          where: {
              user_id: userId
          },
          include: {
              user: true, 
          
          },
               orderBy: {
              id: 'desc'  
          },
          skip: offset, 
          take: limit, 
      });

       
    const totalVlogs = await prisma.video.count({
      where: {
        user_id : userId
      },
    });
    
    const totalPages = Math.ceil(totalVlogs / limit);
 
    res.status(200).json({
      vlogs,
      totalPages,
      currentPage: page
  })
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Chyba server neodpovidá' });
  }
};