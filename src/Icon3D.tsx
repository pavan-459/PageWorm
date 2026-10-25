import { Image, ImageStyle } from 'react-native';

// Microsoft Fluent 3D Emoji (MIT, see assets/icons3d/LICENSE) so icons look
// the same on iOS and Android instead of using each platform's emoji font.
const SOURCES = {
  fire: require('../assets/icons3d/fire.png'),
  gear: require('../assets/icons3d/gear.png'),
  book: require('../assets/icons3d/book.png'),
  books: require('../assets/icons3d/books.png'),
  timer: require('../assets/icons3d/timer.png'),
  leaf: require('../assets/icons3d/leaf.png'),
  sparkles: require('../assets/icons3d/sparkles.png'),
  star: require('../assets/icons3d/star.png'),
  heart: require('../assets/icons3d/heart.png'),
  bell: require('../assets/icons3d/bell.png'),
  trophy: require('../assets/icons3d/trophy.png'),
  seedling: require('../assets/icons3d/seedling.png'),
  crown: require('../assets/icons3d/crown.png'),
  gem: require('../assets/icons3d/gem.png'),
  rocket: require('../assets/icons3d/rocket.png'),
  glowingStar: require('../assets/icons3d/glowingStar.png'),
  party: require('../assets/icons3d/party.png'),
  medal: require('../assets/icons3d/medal.png'),
  sportsMedal: require('../assets/icons3d/sportsMedal.png'),
  lock: require('../assets/icons3d/lock.png'),
  sunrise: require('../assets/icons3d/sunrise.png'),
  owl: require('../assets/icons3d/owl.png'),
  bookmark: require('../assets/icons3d/bookmark.png'),
  target: require('../assets/icons3d/target.png'),
  hourglass: require('../assets/icons3d/hourglass.png'),
  diving: require('../assets/icons3d/diving.png'),
  calendar: require('../assets/icons3d/calendar.png'),
  fireworks: require('../assets/icons3d/fireworks.png'),
  sandwich: require('../assets/icons3d/sandwich.png'),
  ribbon: require('../assets/icons3d/ribbon.png'),
  butterfly: require('../assets/icons3d/butterfly.png'),
  hundred: require('../assets/icons3d/hundred.png'),
  gradCap: require('../assets/icons3d/gradCap.png'),
  rainbow: require('../assets/icons3d/rainbow.png'),
  sparklingHeart: require('../assets/icons3d/sparklingHeart.png'),
  closedBook: require('../assets/icons3d/closedBook.png'),
  moon: require('../assets/icons3d/moon.png'),
  chart: require('../assets/icons3d/chart.png'),
  house: require('../assets/icons3d/house.png'),
  pencil: require('../assets/icons3d/pencil.png'),
  check: require('../assets/icons3d/check.png'),
  gift: require('../assets/icons3d/gift.png'),
};

export type IconName = keyof typeof SOURCES;

export function Icon3D({ name, size = 24, style }: { name: IconName; size?: number; style?: ImageStyle }) {
  return <Image source={SOURCES[name]} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
