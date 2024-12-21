const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function convertDate(monthYear) {
  const months = {
      'leden': '01',
      'únor': '02',
      'březen': '03',
      'duben': '04',
      'květen': '05',
      'červen': '06',
      'červenec': '07',
      'srpen': '08',
      'září': '09',
      'říjen': '10',
      'listopad': '11',
      'prosinec': '12'
  };

  const [month, year] = monthYear.split('-');
  const monthNumber = months[month.toLowerCase()];



  if (!monthNumber || isNaN(year) || year.length !== 4) {
    return null;
  }
  return `${monthNumber}-${year}`;
}

module.exports.getTours = async (req, res) => {
  const countries = req.query.countries;
  const tourTypes = req.query.tourtypes; 
  const tourDates = req.query.tourdates; 
  const countryArray = countries ? countries.split(',') : [];
  const tourTypeArray = tourTypes ? tourTypes.split(',') : []; // Convert tour types to array
  
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  
  const normalizedSearch = removeAccents(search).toLowerCase();

  let dateFilter = {};
  if (tourDates) {
    const convertedValue = convertDate(tourDates); // e.g., "11-2024"

    if (!convertedValue) {
      // If the date format is invalid, return a 400 Bad Request response
      return res.status(400).json({ error: 'Invalid date format' });
    }
    const [month, year] = convertedValue.split('-');

    // Handle year-end transition
    const nextMonth = parseInt(month) === 12 ? '01' : String(parseInt(month) + 1).padStart(2, '0');
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : year;



    dateFilter = {
      OR: [
        {
          tourdate: {
            gte: new Date(`${year}-${month}-01`),
            lt: new Date(`${nextYear}-${nextMonth}-01`),
          }
        },
        {
          tourdateEnd: {
            gte: new Date(`${year}-${month}-01`),
            lt: new Date(`${nextYear}-${nextMonth}-01`),
          }
        }
      ]
    };
  }

  try {
    const allDestinations = await prisma.tour.findMany({
      select: {
        destination: true,
      },
      distinct: ['destination'],
    });

    const uniqueDestinations = await prisma.tour.findMany({
      select: {
        destination: true,
      },
      where: {
        AND: [
          {
            destination: {
              contains: normalizedSearch,
            },
          },
          {
            OR: countryArray.map((country) => ({
              destination: {
                contains: country,
              },
            })),
          },
        ],
      },
      distinct: ['destination'],
    });

  /*   const tours = await prisma.tour.findMany({
      include: {
        user: true,
      },
      where: {
        AND: [
          {
            OR: [
              {
                destination: {
                  contains: normalizedSearch,
                },
              },
              {
                destinationen: {
                  contains: normalizedSearch,
                },
              },
              {
                destinationes: {
                  contains: normalizedSearch,
                },
              },
            ],
          },
          {
            OR: countryArray.map((country) => ({
              destinationes: {
                contains: country,
              },
            })),
          },
          {
            OR: tourTypeArray.map((type) => ({
              tourtype: {
                contains: type,
              },
            })),
          },
          dateFilter, // Add date filter here
        ],
      },
      orderBy: {
        id: 'desc',
      },
      skip: offset,
      take: limit,
    }); */
    
    const tours = await prisma.tour.findMany({
      include: {
        user: true,
      },
      where: {
        AND: [
          {
            OR: [
              {
                destination: {
                  contains: normalizedSearch,
                },
              },
              {
                destinationen: {
                  contains: normalizedSearch,
                },
              },
              {
                destinationes: {
                  contains: normalizedSearch,
                },
              },
            ],
          },
          {
            OR: countryArray.map((country) => ({
              destination: {
                contains: country,
              },
            })),
          },
          {
            OR: tourTypeArray.map((type) => ({
              tourtype: {
                contains: type,
              },
            })),
          },
          dateFilter // Add date filter here
        ],
      },
      orderBy: {
        id: 'desc',
      },
      skip: offset,
      take: limit,
    });

    const totalTours = await prisma.tour.count({
      where: {
        AND: [
          {
            destination: {
              contains: normalizedSearch,
            },
          },
          {
            OR: countryArray.map((country) => ({
              destination: {
                contains: country,
              },
            })),
          },
          {
            OR: tourTypeArray.map((type) => ({
              tourtype: {
                contains: type,
              },
            })),
          },
          dateFilter // Add date filter here as well
        ],
      },
    });

    const totalPages = Math.ceil(totalTours / limit);
/* console.log(tours) */
    res.status(200).json({
      tours,
      totalPages,
      destinations: uniqueDestinations.map((item) => item.destination),
      allDestinations: allDestinations.map((item) => item.destination),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports.getYourTours = async (req, res) => {
  const user = req.user;
  const userId = user.id;
  
  try {


    const yourtours = await prisma.tour.findMany({
      where: {
          user_id: userId
      },
      include: {
          user: true, 
      
      },
           orderBy: {
          id: 'desc'  
      }
  });;

    res.status(201).json({ yourtours });

  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba server neodpovidá' });
  }
}

module.exports.postTour = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const userId = user.id;

  
  try {
    const hasCompleted =
      !data.tour.destination ||
      data.tour.tourtype.length === 0 ||
      !data.tour.fellowtraveler ||
      !data.tour.aboutme ||
      !data.tour.tourdate ||
      !data.tour.tourdateEnd;

    if (hasCompleted) {
      return res.status(403).json({ error: 'Nejsou vyplňena všechna pole' });
    }

    // Adjust dates by adding 1 hour
    const addOneHour = (dateString) => {
      const date = new Date(dateString);
      date.setHours(date.getHours() + 1); // Add 1 hour
      return date;
    };

    const adjustedTourdate = addOneHour(data.tour.tourdate);
    const adjustedTourdateEnd = addOneHour(data.tour.tourdateEnd);

    // Format the dates to 'YYYY-MM-DD'
    const formattedTourdate = adjustedTourdate.toISOString().slice(0, 10);
    const formattedTourdateEnd = adjustedTourdateEnd.toISOString().slice(0, 10);

    // Convert back to valid Date object
    const tourdate = new Date(`${formattedTourdate}T00:00:00.000Z`);
    const tourdateEnd = new Date(`${formattedTourdateEnd}T00:00:00.000Z`);

    // Create new tour in the database using Prisma
    const newTour = await prisma.tour.create({
      data: {
        destination: data.tour.destination,
        destinationen: data.destinationen,
        destinationes: data.destinationes,
        tourdate,       // Date object
        tourdateEnd,    // Date object
        fellowtraveler: data.tour.fellowtraveler,
        aboutme: data.tour.aboutme,
        user_id: userId,
        tourtype: JSON.stringify(data.tour.tourtype), // Convert tourtype array to string
      },
    });

    res.status(201).json({ message: newTour });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba server neodpovidá' });
  }
};

module.exports.updateTour = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const user = req.user;
  const userId = user.id;


  try {
    // Find the existing tour by its ID
    const existingTour = await prisma.tour.findUnique({
      where: { id: parseInt( id) },
    });

    if (!existingTour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    // Validate required fields
    const hasCompleted =
      !data.tour.destination ||
      !data.tour.fellowtraveler ||
      !data.tour.aboutme ||
      !data.tour.tourdate ||
      !data.tour.tourdateEnd ||
      data.tour.tourtype.length === 0;

    if (hasCompleted) {
      return res.status(403).json({ error: 'Nejsou vyplňena všechna pole' });
    }

    // Convert tourdate and tourdateEnd to 'YYYY-MM-DD' format
    const formattedTourdate = new Date(data.tour.tourdate).toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const formattedTourdateEnd = new Date(data.tour.tourdateEnd).toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Convert to Date objects for Prisma
    const tourdate = new Date(`${formattedTourdate}T00:00:00.000Z`);
    const tourdateEnd = new Date(`${formattedTourdateEnd}T00:00:00.000Z`);

    // Update the tour in the database using Prisma
    const updatedTour = await prisma.tour.update({
      where: { id: parseInt(data.tour.id) }, // Specify the tour to update
      data: {
        destination: data.tour.destination,
        tourdate, // Date object
        tourdateEnd, // Date object
        fellowtraveler: data.tour.fellowtraveler,
        aboutme: data.tour.aboutme,
        user_id: userId,
        tourtype: JSON.stringify(data.tour.tourtype), // Convert tourtype array to string
      },
    });

    // Respond with the updated tour
    res.status(200).json({ message: 'Tour successfully updated', updatedTour });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports.deleteTour = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const userId = user.id;


  try {
    const tour = await prisma.tour.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    if (tour.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this tour' });
    }

    await prisma.tour.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(201).json({ message: 'Tour was deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};



module.exports.getTour = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const userId = user.id;


  try {
    const tour = await prisma.tour.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        user: true, // Assuming the `tour` model has a relation field `user`
      },
    });

    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

 /*    console.log(tour) */

    res.status(201).json({ tour: tour });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
