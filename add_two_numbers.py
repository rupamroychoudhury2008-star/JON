def add_two_numbers(a, b):
    """Add two numbers and return the result."""
    return a + b


if __name__ == "__main__":
    # Example usage
    num1 = 10
    num2 = 20
    result = add_two_numbers(num1, num2)
    print(f"{num1} + {num2} = {result}")

    # You can also get input from user
    # num1 = float(input("Enter first number: "))
    # num2 = float(input("Enter second number: "))
    # print(f"Sum: {add_two_numbers(num1, num2)}")