const vendorAuth = (req, res, next) => {
    try {
        // Check if user is authenticated (auth middleware should run first)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        // Check if user is a vendor
        if (req.user.userType !== 'vendor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Vendor privileges required.'
            });
        }

        // Check if vendor is approved (additional check)
        if (req.user.status && req.user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Vendor account is not approved.'
            });
        }

        next();

    } catch (error) {
        console.error('Vendor auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = vendorAuth;