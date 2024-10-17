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

    // Fetch auctions on component mount
    useEffect(() => {
        fetchAuctions();
    }, []);

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
                    // Generate auctioneer's head image URL
                    const auctioneerHeadUrl = `https://minotar.net/helm/${auction.auctioneer}`;
                    // Get rarity color class
                    const rarityColor = getRarityColor(auction.tier);

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
                                    <img
                                        src={auctioneerHeadUrl}
                                        alt={auction.auctioneer}
                                        className="w-10 h-10 rounded-full mr-2"
                                    />
                                    <p className={`font-semibold text-lg ${rarityColor}`}>{auction.item_name}</p>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {parseLoreColors(auction.item_lore)}
                                </div>
                                <p className="text-sm text-gray-400 italic">{auction.extra}</p>
                                <p className="text-gray-700">Price: {formatCoins(auction.starting_bid)} coins</p>
                                <p className="text-gray-700">Seller: {auction.auctioneer}</p>
                                {auction.claimed && (
                                    <p className="text-red-500">This auction has been claimed.</p>
                                )}
                                {auction.claimed_bidders.length > 0 && (
                                    <p className="text-gray-500">
                                        Claimed by: {auction.claimed_bidders.join(', ')}
                                    </p>
                                )}
                                <p className="text-gray-500">
                                    Ending: {new Date(auction.end).toLocaleString()}
                                </p>
                                <p className="text-gray-500">Profile ID: {auction.profile_id}</p>
                                <p className="text-gray-500">Category: {auction.category}</p>
                                <p className="text-gray-500">Tier: {auction.tier}</p>
                                <p className="text-gray-500">Highest Bid: {formatCoins(auction.highest_bid_amount)} coins</p>
                                <p className="text-gray-500">Coop: {auction.coop.join(', ')}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className="flex justify-between mt-4">
                <button
                    onClick={handlePreviousPage}
                    className={`px-4 py-2 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <button
                    onClick={handleNextPage}
                    className={`px-4 py-2 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AuctionsPage;
