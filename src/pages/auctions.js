import { useEffect, useState } from 'react';

// Function to format coin values
const formatCoins = (amount) => {
    if (amount >= 1e6) {
        return `${(amount / 1e6).toFixed(1)}m`; // Format in millions
    } else if (amount >= 1e3) {
        return `${(amount / 1e3).toFixed(1)}k`; // Format in thousands
    }
    return amount.toString(); // Return as string for lower values
};

// Function to get rarity color
const getRarityColor = (tier) => {
    const rarityColors = {
        COMMON: 'text-gray-500',
        UNCOMMON: 'text-green-500',
        RARE: 'text-blue-500',
        EPIC: 'text-purple-500',
        LEGENDARY: 'text-yellow-500',
        MYTHIC: 'text-orange-500',
    };
    return rarityColors[tier] || 'text-black'; // Default color if rarity not found
};

// Function to parse Minecraft lore colors
const parseLoreColors = (lore) => {
    const colorCodes = {
        '§0': 'black',
        '§1': 'dark_blue',
        '§2': 'dark_green',
        '§3': 'dark_aqua',
        '§4': 'dark_red',
        '§5': 'dark_purple',
        '§6': 'gold',
        '§7': 'gray',
        '§8': 'dark_gray',
        '§9': 'blue',
        '§a': 'green',
        '§b': 'aqua',
        '§c': 'red',
        '§d': 'light_purple',
        '§e': 'yellow',
        '§f': 'white',
        '§l': 'font-weight: bold;',
        '§o': 'font-style: italic;',
        '§n': 'text-decoration: underline;',
    };

    return lore.split('\n').map((line, index) => {
        let styledLine = line;
        Object.keys(colorCodes).forEach((code) => {
            const colorStyle = colorCodes[code];
            styledLine = styledLine.replace(new RegExp(code, 'g'), `<span style="${colorStyle}">`);
            styledLine += '</span>';
        });
        return <div key={index} dangerouslySetInnerHTML={{ __html: styledLine }} />;
    });
};

const AuctionsPage = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [playerData, setPlayerData] = useState({}); // State to store player data

    // Function to fetch auction data
    const fetchAuctions = async () => {
        try {
            const response = await fetch('https://api.hypixel.net/v2/skyblock/auctions');
            if (!response.ok) {
                throw new Error('Failed to fetch auction data.');
            }
            const data = await response.json();
            console.log("Fetched Auctions:", data.auctions); // Log fetched auctions
            setAuctions(data.auctions || []);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Function to fetch player name and avatar by UUID from the PlayerDB API
    const fetchPlayerData = async (uuid) => {
        try {
            const response = await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`);
            const data = await response.json();
            if (data.code === "player.found") {
                return {
                    username: data.data.player.username,
                    avatar: data.data.player.avatar
                };
            }
            return { username: uuid, avatar: '' }; // Fallback to UUID if not found
        } catch {
            return { username: uuid, avatar: '' }; // Fallback to UUID if there's an error
        }
    };

    // Function to fetch all player data from UUIDs
    const fetchPlayerDataFromUUIDs = async (uuids) => {
        const dataPromises = uuids.map(uuid => fetchPlayerData(uuid));
        const data = await Promise.all(dataPromises);
        const dataMapping = {};
        uuids.forEach((uuid, index) => {
            dataMapping[uuid] = data[index];
        });
        setPlayerData(prev => ({ ...prev, ...dataMapping }));
    };

    // Fetch auctions and player names on component mount
    useEffect(() => {
        fetchAuctions();
    }, []);

    // Fetch player data after auctions are loaded
    useEffect(() => {
        if (auctions.length > 0) {
            const uniqueUuids = new Set();
            uniqueUuids.add(auctions[0].auctioneer); // Add auctioneer UUID
            auctions.forEach(auction => {
                auction.coop.forEach(uuid => uniqueUuids.add(uuid)); // Add coop UUIDs
            });
            fetchPlayerDataFromUUIDs(Array.from(uniqueUuids)); // Fetch names for all unique UUIDs
        }
    }, [auctions]);

    // Filter items based on search term
    const filteredAuctions = auctions.filter(auction =>
        auction.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const indexOfLastAuction = currentPage * itemsPerPage;
    const indexOfFirstAuction = indexOfLastAuction - itemsPerPage;
    const currentAuctions = filteredAuctions.slice(indexOfFirstAuction, indexOfLastAuction);
    const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);

    if (loading) {
        return <div>Loading auctions...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    // Handler for page navigation
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Auctions</h1>
            <input
                type="text"
                placeholder="Search for items..."
                className="mb-4 p-2 border border-gray-300 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul className="bg-white rounded shadow-md">
                {currentAuctions.map((auction) => {
                    // Generate item image URL
                    const itemImageUrl = `https://static.hypixel.net/skyblock/items/${auction.item_uuid}.png`;
                    // Get rarity color class
                    const rarityColor = getRarityColor(auction.tier);

                    // Get player data
                    const auctioneerData = playerData[auction.auctioneer] || { username: auction.auctioneer, avatar: '' };
                    const coopData = auction.coop.map(uuid => playerData[uuid] || { username: uuid, avatar: '' });

                    return (
                        <li key={auction.uuid} className="flex p-4 border-b border-gray-200 items-start">
                            <img
                                src={itemImageUrl}
                                alt={auction.item_name}
                                className="w-24 h-24 mr-4 rounded"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }} // Fallback image
                            />
                            <div className="flex-grow">
                                <div className="flex items-center mb-2">
                                    {auctioneerData.avatar && (
                                        <img
                                            src={auctioneerData.avatar}
                                            alt={auctioneerData.username}
                                            className="w-10 h-10 rounded-full mr-2"
                                        />
                                    )}
                                    <p className={`font-semibold text-lg ${rarityColor}`}>{auction.item_name}</p>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {parseLoreColors(auction.item_lore)}
                                </div>
                                <p className="text-sm text-gray-400 italic">{auction.extra}</p>
                                <p className="text-gray-700">Price: {formatCoins(auction.starting_bid)} coins</p>
                                <p className="text-gray-700">Seller: {auctioneerData.username}</p>
                                {auction.claimed && (
                                    <p className="text-red-500">This auction has been claimed.</p>
                                )}
                                {auction.claimed_bidders.length > 0 && (
                                    <p className="text-gray-500">Claimed by: {auction.claimed_bidders.join(', ')}</p>
                                )}
                                {coopData.length > 0 && (
                                    <p className="text-gray-500">Coop Members: {coopData.map(data => data.username).join(', ')}</p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className="flex justify-between mt-4">
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">Previous</button>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">Next</button>
            </div>
        </div>
    );
};

export default AuctionsPage;
