# Python code to add two sums

def add_two_numbers(a, b):
    """Add two numbers and return the result."""
    return a + b

# Example usage
if __name__ == "__main__":
    # Define two numbers
    num1 = 10
    num2 = 20
    
    # Calculate the sum
    result = add_two_numbers(num1, num2)
    
    # Print the result
    print(f"The sum of {num1} and {num2} is: {result}")
    
    # You can also get input from user
    # num1 = float(input("Enter first number: "))
    # num2 = float(input("Enter second number: "))
    # print(f"The sum is: {add_two_numbers(num1, num2)}")