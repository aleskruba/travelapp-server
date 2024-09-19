const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

module.exports.getTours = async (req, res) => {
  const countries = req.query.countries
  const countryArray = countries ? countries.split(',') : []; // Default to empty array if no countries


  const search = req.query.search || ''; // Get the search keyword
  const page = parseInt(req.query.page) || 1;  // Get the page number
  const limit = 4;  // Number of items per page
  const offset = (page - 1) * limit;  // Calculate the offset

  // Normalize and lowercase the search term
  const normalizedSearch = removeAccents(search).toLowerCase();

  console.log(countryArray)
  const filterCountries = countryArray.map(country => ({
    destination: {
      contains: country,
    }

  }))



    try {
    // Filter destinations based on the normalized and lowercase search keyword
    const allDestinations = await prisma.tour.findMany({
      select: {
        destination: true
      },
      distinct: ['destination'],
    });

    const uniqueDestinations = await prisma.tour.findMany({
      select: {
        destination: true
      },
      where: {
        AND: [
          {
            destination: {
              contains: normalizedSearch,
            }
          },
          {
            OR: countryArray.map(country => ({
              destination: {
                contains: country,
              }
            }))
          }
        ]
      },
      distinct: ['destination'],
    });
    

    // Filter tours based on the normalized search keyword and paginate
    const tours = await prisma.tour.findMany({
      include: {
        user: true
      },
      where: {
        AND: [
          {
            destination: {
              contains: normalizedSearch,
            }
          },
          {
            OR: countryArray.map(country => ({
              destination: {
                contains: country,
              }
            }))
          }
        ]
      
      },
      orderBy: {
        id: 'desc'
      },
      skip: offset, // Skip the number of items for pagination
      take: limit,  // Limit the number of items per page
    });

    // Get the total number of tours that match the search criteria
    const totalTours = await prisma.tour.count({
      where: {
        AND: [
          {
            destination: {
              contains: normalizedSearch,
            }
          },
          {
            OR: countryArray.map(country => ({
              destination: {
                contains: country,
              }
            }))
          }
        ]
      

        
      },
    });

    const totalPages = Math.ceil(totalTours / limit);

    res.status(200).json({
      tours,
      totalPages,
      destinations: uniqueDestinations.map(item => item.destination),
      allDestinations : allDestinations.map(item => item.destination),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
