import subprocess

AWS_SECRET_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLEDFDFSDSD"

# def execute_user_command(user_input: str):
#     # Triggers Bandit & Semgrep
#     subprocess.run(f"echo {user_input}", shell=True)

def unstable_function():
    # Triggers Ruff
    # unused_secret_key = "plain_text"
    return True