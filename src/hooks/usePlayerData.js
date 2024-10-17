import { useState } from 'react';

export const usePlayerData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch UUID from the Next.js API route
    const fetchUUID = async (username) => {
        try {
            const response = await fetch(`/api/uuid?username=${username}`);
            if (!response.ok) {
                throw new Error('Failed to fetch UUID');
            }
            const data = await response.json();
            return data.id; // UUID of the player
        } catch (err) {
            throw new Error('Error fetching UUID');
        }
    };

    // Fetch player data from SkyCrypt API
    const fetchPlayerData = async (username) => {
        setLoading(true);
        setError('');
        try {
            const uuid = await fetchUUID(username);
            const response = await fetch(`https://sky.shiiyu.moe/api/v2/profile/${uuid}`);
            if (!response.ok) {
                throw new Error('Failed to fetch player data from SkyCrypt. Please try again.');
            }

            const data = await response.json();
            setLoading(false);
            return data;
        } catch (err) {
            setLoading(false);
            setError(err.message);
            return null;
        }
    };

    return { fetchPlayerData, loading, error };
};
