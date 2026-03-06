import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
import React from 'react'
import { Search, Bell, Heart, Filter } from 'lucide-react-native'

const Index = () => {
  // Sample data for popular meals with online images
  const popularMeals = [
    {
      id: 1,
      name: 'Jumbo Burger',
      description: 'Fast food Burger, Chicken, Meat, Different types of sandwiches.',
      rating: 4.8,
      price: 5900,
      image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVyZ2VyfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
      isFavorite: false
    },
    {
      id: 2,
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil.',
      rating: 4.8,
      price: 5900,
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGl6emF8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
      isFavorite: false
    }
  ]

  const categories = [
    { 
      id: 1, 
      name: 'Burger', 
      icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' 
    },
    { 
      id: 2, 
      name: 'Pizza', 
      icon: 'https://cdn-icons-png.flaticon.com/512/1404/1404945.png' 
    },
    { 
      id: 3, 
      name: 'chicken', 
      icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046751.png' 
    },
    { 
      id: 4, 
      name: 'Salad', 
      icon: 'https://cdn-icons-png.flaticon.com/512/2515/2515183.png' 
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hello Abdelalim</Text>
          <Text style={styles.questionText}>What meal Do You Want?</Text>
        </View>

        {/* Promotional Banner Slider */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            {/* Food Image on Left */}
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVyZ2VyJTIwc2FuZHdpY2h8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60' }}
              style={styles.bannerFoodImage}
            />
            
            {/* Text Content on Right */}
            <View style={styles.bannerTextContent}>
              <Text style={styles.bannerTitle}>Our Best Seller!</Text>
              <Text style={styles.bannerSubtitle}>Loved by thousands, now it's your turn!</Text>
              
              <TouchableOpacity style={styles.orderButton}>
                <Text style={styles.orderButtonText}>Order now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Slider Indicators */}
        <View style={styles.paginationDots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>See more</Text>
          </TouchableOpacity>
        </View>

        {/* Category Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={styles.categoryCard}
            >
              <View style={styles.categoryIconContainer}>
                <Image 
                  source={{ uri: category.icon }}
                  style={styles.categoryIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Meals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Meals</Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>See more</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Meals List */}
        <View style={styles.mealsContainer}>
          {popularMeals.map((meal) => (
            <View 
              key={meal.id}
              style={styles.mealCard}
            >
              {/* Left - Food Image */}
              <Image 
                source={{ uri: meal.image }}
                style={styles.mealImage}
                resizeMode="cover"
              />

              {/* Right - Meal Information */}
              <View style={styles.mealInfo}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  {/* Top Right - Heart Icon */}
                  <TouchableOpacity>
                    <Heart size={20} color="#FF6B6B" fill="transparent" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.mealDescription} numberOfLines={2}>
                  {meal.description}
                </Text>

                {/* Rating & Price Row */}
                <View style={styles.mealFooter}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingText}>{meal.rating}</Text>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceFire}>🔥</Text>
                    <Text style={styles.priceText}>
                      {meal.price.toLocaleString()} C
                    </Text>
                  </View>
                </View>

                {/* Bottom Right - Add Button */}
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        
        {/* Extra space for bottom navigation */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  greetingContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  bannerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f97316',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerFoodImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  bannerTextContent: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  orderButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  orderButtonText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '600',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  activeDot: {
    backgroundColor: '#f97316',
    width: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeMoreText: {
    color: '#f97316',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 35,
    height: 35,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  mealsContainer: {
    paddingHorizontal: 16,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  mealImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
    position: 'relative',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  mealDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  mealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceFire: {
    marginRight: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 80,
  },
})