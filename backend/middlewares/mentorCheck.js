// middlewares/mentorCheck.js
const db = require('../config/database');

const checkMentorProfile = async (req, res, next) => {
    try {
        if (req.user.role !== 'mentor') {
            return next();
        }

        const profile = await db.query(
            'SELECT id FROM mentor_profiles WHERE user_id = $1',
            [req.user.id]
        );

        req.user.hasMentorProfile = profile.rows.length > 0;
        req.user.mentorProfile = profile.rows[0] || null;

        next();
    } catch (error) {
        console.error('Erro ao verificar perfil do mentor:', error);
        next();
    }
};

module.exports = { checkMentorProfile };