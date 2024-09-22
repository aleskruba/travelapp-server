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

  if (!monthNumber) {
      throw new Error(`Invalid month name: ${month}`);
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
  const limit = 4;
  const offset = (page - 1) * limit;
  
  const normalizedSearch = removeAccents(search).toLowerCase();

  let dateFilter = {};
  if (tourDates) {
    const convertedValue = convertDate(tourDates); // e.g., "11-2024"
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

    const tours = await prisma.tour.findMany({
      include: {
        user: true,
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
