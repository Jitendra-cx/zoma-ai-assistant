import subprocess

AWS_SECRET_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLEDFDFSDSD"

def unstable_function():
    # Triggers Ruff
    unused_secret_key = "plain_text"
    return True