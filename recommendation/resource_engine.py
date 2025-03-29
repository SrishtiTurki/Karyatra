from typing import List, Dict, Any, Optional
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from concurrent.futures import ThreadPoolExecutor

from .search_providers import SearchProvider, DuckDuckGoProvider, YouTubeProvider, GitHubProvider
from .utils import extract_context_keywords, format_search_query

class ResourceRecommendationEngine:
    def __init__(self, 
                mongodb_uri: str, 
                youtube_api_key: Optional[str] = None,
                github_token: Optional[str] = None):
        """
        Initialize the recommendation engine
        
        Args:
            mongodb_uri: MongoDB connection URI
            youtube_api_key: YouTube API key (optional)
            github_token: GitHub API token (optional)
        """
        # Database connection
        self.client = MongoClient(mongodb_uri)
        self.db = self.client.job_tracker
        self.resources_collection = self.db.resources
        self.user_feedback_collection = self.db.user_feedback
        
        # Initialize search providers
        self.search_providers = {
            "ddg": DuckDuckGoProvider(),
        }
        
        # Add YouTube provider if API key is provided
        if youtube_api_key:
            self.search_providers["youtube"] = YouTubeProvider(youtube_api_key)
            
        # Add GitHub provider if token is provided
        if github_token:
            self.search_providers["github"] = GitHubProvider(github_token)
        
        # Initialize resource cache
        self.resource_cache = {}
    
    def get_recommendations(self, 
                          skills: List[str], 
                          job_context: str = "", 
                          user_preferences: Optional[Dict] = None,
                          max_results: int = 15) -> Dict[str, List[Dict]]:
        """
        Generate resource recommendations based on skills and job context
        
        Args:
            skills: List of skills to find resources for
            job_context: Job description or context
            user_preferences: User preferences for personalization
            max_results: Maximum number of results per skill
            
        Returns:
            Dictionary mapping skills to lists of recommended resources
        """
        recommendations = {}
        
        # Extract context keywords from job context
        context_keywords = extract_context_keywords(job_context) if job_context else []
        
        # Process each skill
        for skill in skills:
            # Check cache first
            cache_key = f"{skill}_{'-'.join(context_keywords)}"
            if cache_key in self.resource_cache:
                recommendations[skill] = self.resource_cache[cache_key][:max_results]
                continue
                
            skill_recommendations = []
            
            # Step 1: Check curated database first
            db_resources = self._get_curated_resources(skill, context_keywords, max_results//2)
            skill_recommendations.extend(db_resources)
            
            # Step 2: If we need more resources, use search APIs
            if len(skill_recommendations) < max_results:
                remaining_count = max_results - len(skill_recommendations)
                search_results = self._search_external_resources(skill, context_keywords, remaining_count)
                
                # Filter out duplicates
                existing_urls = {r["url"] for r in skill_recommendations}
                for result in search_results:
                    if result["url"] not in existing_urls:
                        skill_recommendations.append(result)
                        existing_urls.add(result["url"])
            
            # Step 3: Apply personalization
            if user_preferences:
                skill_recommendations = self._personalize_results(
                    skill_recommendations, 
                    user_preferences
                )
            
            # Add to results and cache
            recommendations[skill] = skill_recommendations[:max_results]
            self.resource_cache[cache_key] = skill_recommendations
        
        return recommendations
    
    def _get_curated_resources(self, skill: str, context_keywords: List[str], limit: int) -> List[Dict]:
        """
        Retrieve resources from curated database
        
        Args:
            skill: Skill to find resources for
            context_keywords: Context keywords for relevance
            limit: Maximum number of resources to return
            
        Returns:
            List of curated resources
        """
        # Build query to find resources for this skill
        query = {
            "$and": [
                {"skill": {"$regex": skill, "$options": "i"}},
                {"active": True}
            ]
        }
        
        # If we have context keywords, prioritize resources with matching tags
        if context_keywords:
            # Use aggregation to score and sort by keyword matches
            pipeline = [
                {"$match": query},
                {"$addFields": {
                    "contextScore": {
                        "$sum": [
                            {"$cond": [{"$in": [kw, "$tags"]}, 2, 0]} for kw in context_keywords
                        ] + [
                            {"$cond": [{"$regexMatch": {"input": "$title", "regex": kw, "options": "i"}}, 1, 0]} 
                            for kw in context_keywords
                        ]
                    }
                }},
                {"$sort": {"contextScore": -1, "rating": -1}},
                {"$limit": limit}
            ]
            
            results = list(self.resources_collection.aggregate(pipeline))
        else:
            # Without context, sort by rating and recency
            results = list(self.resources_collection.find(query)
                         .sort([("rating", -1), ("added_date", -1)])
                         .limit(limit))
        
        # Format results
        return [self._format_resource(r) for r in results]
    
    def _search_external_resources(self, skill: str, context_keywords: List[str], limit: int) -> List[Dict]:
        """
        Search external resources using search providers
        
        Args:
            skill: Skill to search for
            context_keywords: Context keywords for relevance
            limit: Maximum number of resources to return
            
        Returns:
            List of resources from external sources
        """
        results = []
        per_provider_limit = max(1, limit // len(self.search_providers))
        
        # Create search queries for different use cases
        learn_query = format_search_query(skill, context_keywords, "learn")
        practice_query = format_search_query(skill, context_keywords, "practice")
        interview_query = format_search_query(skill, context_keywords, "interview")
        
        # Execute searches in parallel
        with ThreadPoolExecutor(max_workers=len(self.search_providers) * 3) as executor:
            futures = []
            
            # Submit search tasks for each provider and query type
            for provider_name, provider in self.search_providers.items():
                futures.append(
                    executor.submit(provider.search, learn_query, per_provider_limit // 2)
                )
                futures.append(
                    executor.submit(provider.search, practice_query, per_provider_limit // 4)
                )
                futures.append(
                    executor.submit(provider.search, interview_query, per_provider_limit // 4)
                )
            
            # Collect results
            for future in futures:
                results.extend(future.result())
        
        return results
    
    def _personalize_results(self, resources: List[Dict], user_preferences: Dict) -> List[Dict]:
        """
        Personalize results based on user preferences
        
        Args:
            resources: List of resources to personalize
            user_preferences: User preferences
            
        Returns:
            Personalized and sorted resources
        """
        scored_resources = []
        
        for resource in resources:
            score = 10  # Base score
            
            # Adjust score based on preferred resource types
            if "preferred_types" in user_preferences and user_preferences["preferred_types"]:
                if resource["resource_type"] in user_preferences["preferred_types"]:
                    score += 5
                    
            # Adjust score based on preferred sources
            if "preferred_sources" in user_preferences and user_preferences["preferred_sources"]:
                if resource["source"] in user_preferences["preferred_sources"]:
                    score += 5
            
            # Adjust score based on experience level (if available)
            if "experience_level" in user_preferences and "level" in resource:
                if resource["level"] == user_preferences["experience_level"]:
                    score += 3
            
            # Add score to resource and append to list
            resource["_score"] = score
            scored_resources.append(resource)
        
        # Sort by score and return
        return sorted(scored_resources, key=lambda x: x.pop("_score", 0), reverse=True)
    
    def _format_resource(self, resource: Dict) -> Dict:
        """Format a resource document for API response"""
        return {
            "id": str(resource.get("_id", "")),
            "title": resource.get("title", ""),
            "url": resource.get("url", ""),
            "source": resource.get("source", ""),
            "resource_type": resource.get("resource_type", ""),
            "description": resource.get("description", ""),
            "rating": resource.get("rating", 0),
            "tags": resource.get("tags", []),
            "level": resource.get("level", "beginner")
        }
    
    def record_feedback(self, resource_id: str, user_id: str, feedback: Dict) -> bool:
        """
        Record user feedback on a resource
        
        Args:
            resource_id: Resource ID
            user_id: User ID
            feedback: Feedback data (rating, helpful, comments)
            
        Returns:
            Success status
        """
        try:
            feedback_doc = {
                "resource_id": resource_id,
                "user_id": user_id,
                "rating": feedback.get("rating"),
                "helpful": feedback.get("helpful"),
                "comments": feedback.get("comments"),
                "timestamp": datetime.now()
            }
            
            self.user_feedback_collection.insert_one(feedback_doc)
            
            # Update resource rating based on new feedback
            if "rating" in feedback:
                self._update_resource_rating(resource_id, feedback["rating"])
                
            return True
        except Exception as e:
            print(f"Error recording feedback: {e}")
            return False
    
    def _update_resource_rating(self, resource_id: str, new_rating: int) -> None:
        """Update the average rating of a resource based on new feedback"""
        try:
            # Get current rating data
            resource = self.resources_collection.find_one({"_id": ObjectId(resource_id)})
            
            if not resource:
                return
                
            current_rating = resource.get("rating", 0)
            num_ratings = resource.get("num_ratings", 0)
            
            # Calculate new average rating
            new_avg_rating = ((current_rating * num_ratings) + new_rating) / (num_ratings + 1)
            
            # Update resource document
            self.resources_collection.update_one(
                {"_id": ObjectId(resource_id)},
                {
                    "$set": {
                        "rating": new_avg_rating,
                        "num_ratings": num_ratings + 1
                    }
                }
            )
        except Exception as e:
            print(f"Error updating resource rating: {e}")
    
    def add_resource(self, resource_data: Dict) -> str:
        """
        Add a new resource to the curated database
        
        Args:
            resource_data: Resource data
            
        Returns:
            ID of the new resource
        """
        try:
            # Add metadata
            resource_data["added_date"] = datetime.now()
            resource_data["active"] = True
            resource_data["rating"] = 0
            resource_data["num_ratings"] = 0
            
            # Insert into database
            result = self.resources_collection.insert_one(resource_data)
            
            # Clear cache
            self.resource_cache = {}
            
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error adding resource: {e}")
            return None