// Sample file to test CodeChronicle
function calculateTotal(items) {
    let total = 0;
    for (let item of items) {
        total += item.price;
    }
    return total;
}

function applyDiscount(total, discountPercent) {
    return total - (total * discountPercent / 100);
}

module.exports = { calculateTotal, applyDiscount };
