import subprocess

user_input = input()

subprocess.run(
    user_input,
    shell=True
)