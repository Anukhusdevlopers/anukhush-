const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // This should be 'authorization'
    const token = authHeader && authHeader.split(' ')[1]; // Extract token

    console.log('Auth Header:', authHeader); // Debug line to check header

    if (!token) {
        return res.status(401).json({ message: 'Auth token must be provided in headers.' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);

            return res.status(403).json({ message: 'Invalid auth token' });
        }

        req.user = user; // Attach the decoded user object to request
        next();
    });
};

module.exports = authenticateToken;
