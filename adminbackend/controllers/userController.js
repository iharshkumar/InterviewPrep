const User = require('../../backend/models/User');
const Interview = require('../../backend/models/Interview');

// Get all users with search filtering and sorting
const getUsers = async (req, res) => {
  try {
    const { search, sortBy = 'createdAt', order = 'desc' } = req.query;
    let query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: regex },
          { email: regex },
          { college: regex },
          { branch: regex }
        ]
      };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const users = await User.find(query).sort({ [sortBy]: sortOrder });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
  }
};

// Get single user details
const getUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user: ' + error.message });
  }
};

// Update user details
const updateUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'User updated successfully', user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user: ' + error.message });
  }
};

// Delete user and cascade delete interviews
const deleteUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;

    // Delete user
    const user = await User.findOneAndDelete({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's interviews
    await Interview.deleteMany({ userUid: uid });

    return res.json({ message: 'User and associated interviews deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete user: ' + error.message });
  }
};

module.exports = {
  getUsers,
  getUserByUid,
  updateUserByUid,
  deleteUserByUid
};
