// Sample file to test CodeChronicle
function calculateTotal(items) {
    let total = 0;
    for (let item of items) {
        // Add tax calculation
        total += item.price * 1.1; // 10% tax
    }
    return total;
}

function applyDiscount(total, discountPercent) {
    // Validate discount percentage
    if (discountPercent < 0 || discountPercent > 100) {
        throw new Error('Invalid discount percentage');
    }
    return total - (total * discountPercent / 100);
}

module.exports = { calculateTotal, applyDiscount };
