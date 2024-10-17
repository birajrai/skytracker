import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { usePlayerData } from '../hooks/usePlayerData';

// Spinner Component
// Spinner Component
const Spinner = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-400"></div>
    </div>
);

// Player Item Component
const PlayerItem = ({ player, removePlayer }) => {
    const skinUrl = `https://minotar.net/helm/${player.name}/32`;

    return (
        <li className="bg-skyblock-dark border-skyblock-light border-2 p-2 rounded-lg flex justify-between items-center shadow-lg">
            <div className="flex items-center">
                <img src={skinUrl} alt={`${player.name}'s skin`} className="mr-2 rounded-full border border-skyblock-gold" />
                <div>
                    <h2 className="font-bold text-md text-skyblock-gold">{player.name}</h2>
                    <p className="text-gray-300 text-sm">Status: {player.online ? 'Online' : 'Offline'}</p>
                    <p className="text-gray-300 text-sm">Game: {player.game || 'N/A'}</p>
                    <p className="text-gray-300 text-sm">Last Online: {player.lastLogin ? new Date(player.lastLogin).toLocaleString() : 'N/A'}</p>
                    <p className="text-gray-300 text-sm">Playtime: {player.sessionLength || 'N/A'} minutes</p>
                </div>
            </div>
            <button onClick={() => removePlayer(player.name)} className="bg-red-600 hover:bg-red-700 text-white p-1 rounded">
                Delete
            </button>
        </li>
    );
};

export default function Home() {
    const { fetchPlayerData, loading, error } = usePlayerData();
    const [players, setPlayers] = useState([]);
    const [newPlayer, setNewPlayer] = useState('');
    const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);

    // Load players from cookies when the page loads
    useEffect(() => {
        const storedPlayers = Cookies.get('players');
        console.log('Loaded players from cookies:', storedPlayers); // Debugging line
        if (storedPlayers) {
            const playerNames = storedPlayers.split(','); // Split names by comma
            console.log('Parsed player names:', playerNames); // Debugging line
            setPlayers(playerNames);
        }
        setIsFetchingPlayers(false);
    }, []);

    // Save player names to cookies whenever the players list changes
    useEffect(() => {
        if (players.length > 0) {
            Cookies.set('players', players.join(','), { expires: 7, path: '/' }); // Save only player names as a comma-separated string
            console.log('Updated player names in cookies:', players); // Debugging line
        } else {
            // Optionally remove the cookie if there are no players
            Cookies.remove('players', { path: '/' });
            console.log('Removed player names cookie'); // Debugging line
        }
    }, [players]);

    // Add new player to the list
    const addPlayer = async (e) => {
        e.preventDefault();

        if (!newPlayer) {
            alert('Username cannot be empty.');
            return;
        }

        setIsFetchingPlayers(true);
        const playerData = await fetchPlayerData(newPlayer);

        console.log('Fetched player data for:', newPlayer, playerData); // Debugging line

        if (playerData) {
            const updatedPlayers = [...players, newPlayer]; // Store only the player's name
            console.log('Updated player names list before setting state:', updatedPlayers); // Debugging line
            setPlayers(updatedPlayers);
            setNewPlayer('');
        } else {
            console.log('No player data returned for:', newPlayer); // Debugging line
        }

        setIsFetchingPlayers(false);
    };

    // Remove player from the list
    const removePlayer = (name) => {
        const updatedPlayers = players.filter((player) => player !== name);
        console.log('Removed player:', name, 'Updated player names list:', updatedPlayers); // Debugging line
        setPlayers(updatedPlayers);
    };

    return (
        <div className="w-full p-4 bg-skyblock-dark text-skyblock-light min-h-screen">
            <h1 className="text-4xl font-bold text-skyblock-gold mb-4 text-center">SkyTracker - Best Hypixel Player Tracker</h1>

            {/* Add Player Form */}
            <form onSubmit={addPlayer} className="flex justify-center mb-4">
                <input
                    type="text"
                    value={newPlayer}
                    onChange={(e) => setNewPlayer(e.target.value)}
                    placeholder="Enter player username"
                    className="border p-2 rounded w-1/2 bg-skyblock-light text-skyblock-dark"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white p-2 rounded ml-2 flex items-center"
                    disabled={loading}
                >
                    {loading ? <Spinner /> : 'Add Player'}
                </button>
            </form>

            {/* Error Message */}
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

            {/* Player List */}
            <ul className="space-y-2">
                {isFetchingPlayers
                    ? <Spinner />
                    : players.map((player) => (
                        <PlayerItem key={player} player={{ name: player }} removePlayer={removePlayer} />
                    ))}
            </ul>
        </div>
    );
}
