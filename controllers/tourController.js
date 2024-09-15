const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


module.exports.getTours = async (req, res) => {

  const page = parseInt(req.query.page) ;  // Get the page number from query parameters, default to 1
  const limit = 4;  // Number of items per page
  const offset = (page - 1) * limit;  // Calculate the offset



  try {

      const uniqueDestinations = await prisma.tour.findMany({
        select: {
          destination: true
        },
        distinct: ['destination']
      });

      const tours = await prisma.tour.findMany({
        include: {
            user: true
        }, 
          orderBy: {
              id: 'desc'  
          },
          skip: offset, // Skip the number of items for pagination
          take: limit,  // Limit the number of items per page
      });
 
      const totalTours = await prisma.tour.count({
           });
      
      const totalPages = Math.ceil(totalTours / limit);
    //  console.log(messages.length , ' totalPages:',totalPages, 'currentPage:',page )

    console.log(tours.length)
      res.status(200).json({
          tours,
          totalPages,
          destinations: uniqueDestinations.map(item => item.destination) 
     
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
  }
};
