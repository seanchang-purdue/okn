# Define variables
DOCKER_USERNAME := seanochang
REGISTRY_NAME := okn-dev
TAG := latest

# ECR variables (replace with your actual values)
AWS_ACCOUNT_ID := 324037296719
AWS_REGION := us-east-2
ECR_REPO := okn

# Full ECR repository URL
ECR_URL := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(ECR_REPO)

# Ensure DOCKER_USERNAME is set
check-username:
	@if [ -z "$(DOCKER_USERNAME)" ]; then \
		echo "DOCKER_USERNAME is not set. Please set it to your Docker Hub username."; \
		exit 1; \
	fi

# Login to ECR
ecr-login:
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_URL)

# Build and push Nginx image
nginx: check-username ecr-login
	docker buildx create --use
	docker buildx build --platform linux/amd64 \
		-t $(ECR_URL):nginx-$(TAG) \
		--push \
		./nginx

# Build and push Server image
server: check-username ecr-login
	docker buildx create --use
	docker buildx build --platform linux/amd64 \
		-t $(ECR_URL):server-$(TAG) \
		--push \
		./server

# Build and push Client image
client: check-username ecr-login
	docker buildx create --use
	docker buildx build --platform linux/amd64 \
		-t $(ECR_URL):client-$(TAG) \
		--push \
		./client

# Build and push all images
all: nginx server client

# Clean up buildx builder
clean:
	docker buildx rm

.PHONY: all nginx server client clean check-username ecr-login
