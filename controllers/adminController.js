const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


module.exports.getUsers = async (req, res) => {
  try {
    const { userId, email } = req.query; // Extract query parameters

    const whereConditions = {
      OR: [],
    };

    if (email) {
      whereConditions.OR.push({
        email: {
          contains: email,
        },
      });
    }

    if (userId) {
      whereConditions.OR.push({
        id: parseInt(userId),
      });
    }

    // If neither email nor userId is provided, send an error
    if (whereConditions.OR.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one query parameter: userId or email' });
    }

    const users = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        email: true,
      },
    });
  
    res.status(200).json({ users });

  } catch (err) {
    console.error('Error:', err); // Log any errors for debugging
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports.getUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Use findUnique to fetch a single user by id
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id), // Ensure the id is treated as an integer
      },
      include: {
        loginLogs: true, // Include related LoginLog records
      },
    });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'No user found' });
    }

    res.status(200).json({ user }); // Return 200 OK with the user data
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports.getLoginData = async (req, res) => {
  try {
    // Fetch login log data, including the user details
    const loginData = await prisma.loginLog.findMany({
      include: {
        user: true, // Include related user data
      },
    });

    // Check if no data was returned
    if (!loginData) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Get the current date and subtract two months
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Filter login data to get only `FAILURE` statuses within the last two months
    const filteredFailures = loginData.filter(log => 
      log.status === 'FAILURE' && new Date(log.timestamp) >= twoMonthsAgo
    );

    // Group the failures by user_id
    const failureCountByUser = filteredFailures.reduce((acc, log) => {
      const userId = log.user_id;

      if (!acc[userId]) {
        acc[userId] = 0;
      }
      acc[userId]++;

      return acc;
    }, {});

    // Find users with more than 3 failures
    const suspiciousArray = Object.entries(failureCountByUser)
      .filter(([userId, failureCount]) => failureCount > 3)
      .map(([userId, failureCount]) => ({
        userId,
        failureCount,
      }));



    // Send back the suspicious login data
    res.status(200).json({ suspiciousArray });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
