import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const registrationSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().min(10, { message: "Phone number is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegistrationProps {
  onComplete: (phoneNumber: string) => void;
}

const Registration = ({ onComplete }: RegistrationProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false
    }
  });

  const onSubmit = (data: RegistrationFormValues) => {
    console.log(data);
    // In a real app, we would call the API to register the user
    onComplete(data.phoneNumber);
  };

  return (
    <div className="fixed inset-0 bg-white p-6 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Get Started with HitchIt</h1>
        <p className="text-gray-500">Let's get started! Enter your phone number to create your HitchIt account.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600">Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <Input 
                      {...field} 
                      className="pl-10 py-6 rounded-xl bg-white" 
                      placeholder="Enter your name" 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <Input 
                      {...field} 
                      type="email" 
                      className="pl-10 py-6 rounded-xl bg-white" 
                      placeholder="Enter your email" 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600">Phone Number</FormLabel>
                <FormControl>
                  <div className="relative flex">
                    <div className="flex items-center px-3 border rounded-l-xl bg-white">
                      <div className="flex items-center">
                        <img src="https://cdn.jsdelivr.net/npm/flag-icon-css@3.5.0/flags/4x3/us.svg" alt="US" className="w-5 h-4 mr-1" />
                        <span className="text-sm">+1</span>
                        <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                    <Input 
                      {...field} 
                      type="tel" 
                      className="flex-1 py-6 rounded-r-xl bg-white" 
                      placeholder="(123) 456-7890" 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <Input 
                      {...field} 
                      type={isPasswordVisible ? "text" : "password"}
                      className="pl-10 pr-10 py-6 rounded-xl bg-white" 
                      placeholder="Create a password" 
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-3 text-gray-500"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-600">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <Input 
                      {...field} 
                      type={isConfirmPasswordVisible ? "text" : "password"}
                      className="pl-10 pr-10 py-6 rounded-xl bg-white" 
                      placeholder="Confirm your password" 
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-3 text-gray-500"
                      onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    >
                      {isConfirmPasswordVisible ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm text-gray-600">
                    I agree to HitchIt's{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms & Conditions
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full py-6 bg-primary rounded-full text-white font-medium">
            Create Account
          </Button>
        </form>
      </Form>

      <div className="flex items-center my-6">
        <Separator className="flex-1" />
        <span className="px-4 text-gray-500 text-sm">or</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-4">
        <Button variant="outline" className="w-full py-6 rounded-full bg-white border flex items-center justify-center space-x-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" fill="white"/>
            <path d="M12.0003 22C14.4071 22 16.6438 21.0515 18.323 19.4415L15.8252 17.1147C14.9445 17.7238 13.8604 18.134 12.0003 18.134C9.39618 18.134 7.19059 16.3878 6.40029 14.0001H3.82129V16.3846C5.48247 19.6295 8.52918 22 12.0003 22Z" fill="#34A853"/>
            <path d="M6.3999 13.9999C6.1999 13.3999 6.0999 12.7999 6.0999 11.9999C6.0999 11.1999 6.1999 10.5999 6.3999 9.99992H3.8209V12.3999H6.3999V13.9999Z" fill="#FBBC05"/>
            <path d="M12.0004 5.86636C13.5004 5.86636 14.7004 6.42727 15.6004 7.27273L17.8004 5.12727C16.1004 3.52727 14.1004 2.54545 12.0004 2.54545C8.5292 2.54545 5.48248 4.91591 3.8213 8.16364L6.40029 10.5455C7.19059 8.15773 9.39629 6.41136 12.0004 5.86636Z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </Button>

        <Button variant="outline" className="w-full py-6 rounded-full bg-white border flex items-center justify-center space-x-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0001 1.99951C6.47715 1.99951 2 6.47666 2 11.9996C2 17.5225 6.47715 21.9996 12.0001 21.9996C17.5229 21.9996 22.0001 17.5225 22.0001 11.9996C22.0001 6.47666 17.5229 1.99951 12.0001 1.99951Z" fill="white"/>
            <path d="M16.7834 16.2794C16.4665 16.9283 16.0999 17.5234 15.6329 18.0728C15.0116 18.799 14.5206 19.268 14.1626 19.48C13.6143 19.828 13.0283 20.0077 12.4034 20.0217C11.9723 20.0217 11.4569 19.9005 10.8603 19.655C10.2621 19.4107 9.72729 19.2894 9.25431 19.2894C8.75789 19.2894 8.20764 19.4107 7.60281 19.655C6.99684 19.9005 6.50938 20.0286 6.13839 20.0402C5.53887 20.0624 4.9393 19.8768 4.33948 19.48C3.95164 19.2465 3.43846 18.7564 2.8001 18.0097C2.1177 17.2072 1.55865 16.2639 1.12285 15.1772C0.654336 13.9932 0.419922 12.8451 0.419922 11.7321C0.419922 10.4506 0.736148 9.35456 1.3688 8.44633C1.86522 7.72301 2.51682 7.15105 3.32557 6.72911C4.13431 6.30714 5.00731 6.08797 5.94693 6.07479C6.40306 6.07479 7.01409 6.21575 7.78342 6.493C8.5503 6.77111 9.04672 6.91323 9.2719 6.91323C9.4417 6.91323 9.97511 6.74874 10.8688 6.42092C11.7158 6.11441 12.4458 5.98079 13.0619 6.01819C14.8404 6.13156 16.1664 6.8383 17.0358 8.14219C15.4559 9.10998 14.6718 10.452 14.6832 12.165C14.6935 13.5219 15.1848 14.6217 16.1556 15.4609C16.5917 15.8515 17.0788 16.1448 17.6214 16.343C17.3533 16.6766 17.0732 16.9871 16.7834 16.2794ZM13.1614 2.76301C13.1614 3.83128 12.7742 4.82686 12.0025 5.74801C11.0813 6.82471 9.97394 7.43855 8.79074 7.35047C8.77899 7.22038 8.77192 7.08407 8.77192 6.9414C8.77192 5.92047 9.21126 4.82686 9.97865 3.92704C10.3618 3.47221 10.8518 3.09803 11.4486 2.80448C12.0442 2.51613 12.607 2.35892 13.1362 2.33398C13.1527 2.47729 13.1614 2.62061 13.1614 2.76301Z" fill="black"/>
          </svg>
          <span>Continue with Apple</span>
        </Button>
      </div>

      <div className="mt-6 text-center text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
};

export default Registration;