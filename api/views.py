from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from .models import Profile, Post, Comment, Like
from .serializers import UserSerializer, ProfileSerializer, PostSerializer, CommentSerializer, LikeSerializer

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Standard way to create a user with hashed password
            user = User.objects.create_user(
                username=serializer.validated_data['username'],
                email=serializer.validated_data.get('email', ''),
                password=request.data.get('password') # Use request.data to be 100% sure
            )
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key, 
                'user_id': user.pk, 
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from django.contrib.auth import authenticate

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'detail': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Try finding user by username OR email for better UX
        try:
            if '@' in username:
                user = User.objects.get(email=username)
            else:
                user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'non_field_errors': ['User not found.']}, status=status.HTTP_400_BAD_REQUEST)

        if user.check_password(password):
            if not user.is_active:
                return Response({'non_field_errors': ['User account is disabled.']}, status=status.HTTP_400_BAD_REQUEST)
                
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'username': user.username
            })
        else:
            return Response({'non_field_errors': ['Incorrect password.']}, status=status.HTTP_400_BAD_REQUEST)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user.profile)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        profile_to_follow = self.get_object()
        user_profile = request.user.profile
        if profile_to_follow == user_profile:
            return Response({'detail': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user_profile.following.filter(pk=profile_to_follow.pk).exists():
            user_profile.following.remove(profile_to_follow)
            return Response({'detail': 'Unfollowed successfully.'}, status=status.HTTP_200_OK)
        else:
            user_profile.following.add(profile_to_follow)
            return Response({'detail': 'Followed successfully.'}, status=status.HTTP_200_OK)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer

    def get_queryset(self):
        if self.action == 'list':
            user = self.request.user
            if user.is_authenticated and hasattr(user, 'profile'):
                following_profiles = user.profile.following.all()
                following_users = [p.user for p in following_profiles]
                following_users.append(user)
                return Post.objects.filter(author__in=following_users).order_by('-created_at')
            elif user.is_authenticated:
                return Post.objects.filter(author=user).order_by('-created_at')
        return super().get_queryset()

    @action(detail=False, methods=['get'])
    def explore(self, request):
        # Show all posts for explore
        posts = Post.objects.all().order_by('-created_at')
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'detail': 'Post unliked.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Post liked.'}, status=status.HTTP_201_CREATED)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
