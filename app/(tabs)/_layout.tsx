import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={24} color={color} />
  );
}

// ─── More bubble menu ─────────────────────────────────────────────────────────

const BUBBLES: { label: string; route: string; icon: IoniconName }[] = [
  { label: 'Ranks',   route: '/(tabs)/leaderboard', icon: 'trophy-outline' },
  { label: 'Rewards', route: '/(tabs)/rewards',     icon: 'gift-outline'   },
  { label: 'Impact',  route: '/(tabs)/impact',      icon: 'leaf-outline'   },
];

function MoreTabButton() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const anims = useRef(BUBBLES.map(() => new Animated.Value(0))).current;

  const openMenu = () => {
    setOpen(true);
    Animated.stagger(
      55,
      anims.map(a =>
        Animated.spring(a, {
          toValue: 1,
          damping: 14,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ),
    ).start();
  };

  const closeMenu = (afterClose?: () => void) => {
    Animated.stagger(
      40,
      [...anims].reverse().map(a =>
        Animated.timing(a, { toValue: 0, duration: 140, useNativeDriver: true }),
      ),
    ).start(() => {
      setOpen(false);
      afterClose?.();
    });
  };

  const handleMorePress = () => (open ? closeMenu() : openMenu());

  const handleBubblePress = (route: string) => {
    closeMenu(() => router.push(route as any));
  };

  return (
    <>
      <TouchableOpacity style={styles.moreButton} onPress={handleMorePress} activeOpacity={0.7}>
        <Ionicons
          name="ellipsis-horizontal"
          size={24}
          color={open ? Colors.emerald600 : Colors.gray400}
        />
        <Text style={[styles.moreLabel, open && styles.moreLabelActive]}>More</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} onRequestClose={() => closeMenu()} animationType="none">
        {/* Dismiss backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => closeMenu()}
        />

        {/* Bubbles — anchored above the tab bar on the right */}
        <View
          pointerEvents="box-none"
          style={[styles.bubblesAnchor, { bottom: 68 + insets.bottom + 10 }]}
        >
          {BUBBLES.map((bubble, i) => (
            <Animated.View
              key={bubble.route}
              style={{
                opacity: anims[i],
                transform: [
                  { scale: anims[i] },
                  {
                    translateY: anims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.bubble}
                onPress={() => handleBubblePress(bubble.route)}
                activeOpacity={0.8}
              >
                <Ionicons name={bubble.icon} size={15} color={Colors.emerald700} />
                <Text style={styles.bubbleText}>{bubble.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  moreButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 8,
    gap: 3,
  },
  moreLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.gray400,
  },
  moreLabelActive: {
    color: Colors.emerald600,
  },
  bubblesAnchor: {
    position: 'absolute',
    right: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.emerald200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray900,
  },
});

// ─── Tab layout ───────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.emerald600,
        tabBarInactiveTintColor: Colors.gray400,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray200,
          paddingTop: 4,
          paddingBottom: 8,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      {/* ── Visible tabs ─────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="routes"
        options={{ title: 'Routes', tabBarIcon: tabIcon('map', 'map-outline') }}
      />
      <Tabs.Screen
        name="forum"
        options={{ title: 'Forum', tabBarIcon: tabIcon('chatbubbles', 'chatbubbles-outline') }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{ title: 'Shop', tabBarIcon: tabIcon('storefront', 'storefront-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarButton: () => <MoreTabButton />,
        }}
      />

      {/* ── Hidden from tab bar, accessible via More bubbles ─ */}
      <Tabs.Screen name="impact"       options={{ href: null }} />
      <Tabs.Screen name="rewards"      options={{ href: null }} />
      <Tabs.Screen name="leaderboard"  options={{ href: null }} />
    </Tabs>
  );
}
