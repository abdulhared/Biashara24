// Vite includes these local assets in development and production builds.
const assets = import.meta.glob('../../images/product_images/*.png', {eager:true, query:'?url', import:'default'});
const photo = time => assets[`../../images/product_images/Screenshot 2026-10-02 ${time}.png`];
const products = [
 [/\b(pizza)\b/, '030824'],
 [/\b(loaded fries|loaded chips)\b/, '031039'],
 [/\b(chips|fries|french fries)\b/, '030844'],
 [/\b(coca cola|coke|cola)\b/, '030856'],
 [/\b(ice cream|icecream)\b/, '030941'],
 [/\b(cupcake|cupcakes)\b/, '031124'],
 [/\b(cake|cakes)\b/, '031002'],
 [/\b(cinnamon roll|cinnamon rolls|cinnamon bun|cinnamon buns)\b/, '031015'],
 [/\b(shawarma|wrap|wraps)\b/, '031053'],
 [/\b(croissant|croissants)\b/, '031107'],
 [/\b(takeaway coffee|take away coffee)\b/, '031254'],
 [/\b(coffee|latte|cappuccino|espresso)\b/, '031227'],
 [/\b(lemon juice|lemonade|iced lemon tea)\b/, '031408'],
 [/\b(crepe|crepes|pancake|pancakes)\b/, '031445'],
 [/\b(chicken combo|chicken meal|kfc)\b/, '031504'],
 [/\b(mojito)\b/, '031652'],
 [/\b(tea|chai)\b/, '031852'],
];

export function productImage(item) {
 if (!item) return undefined;
 const assigned = item.image || item.image_url;
 if (assigned) return assigned;
 const name = (item.name || '').toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();
 const match = products.find(([pattern]) => pattern.test(name));
 return match ? photo(match[1]) : undefined;
}
