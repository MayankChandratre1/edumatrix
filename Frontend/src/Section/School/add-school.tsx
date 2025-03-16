import {  useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Loading from "../Loading";
import { addSchool, getCurrrentSchool, getStats, resetStudentRoster, updateSchool } from "@/api";
import SchoolStats from "./component/school-stats";
import AllCharts from "./component/all-charts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Modal from "./Modal";

const STATE_OPTIONS = [
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC',
  'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
  'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE',
  'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK',
  'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'VI', 'WA', 'WV', 'WI', 'WY'
];

export default function SchoolPage() {
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState("AL");
  const [country, setCountry] = useState("United States");

  const [showResetModal, setShowResetModal] = useState(false);

  const [stats, setStats] = useState({
      teachers:0,
      students:0,
      points:0,
      oopsie: 0,
      feedbacks: 0
    })
  
    useEffect(()=>{
      const fetchStats = async () => {
          const res = await getStats()
          console.log(res);
          setStats({
              teachers: res.totalTeachers,
              students: res.totalStudents,
              points: res.totalPoints,
              oopsie: res.totalOopsiePoints,
              feedbacks: res.totalFeedbackCount
          })
      }
      fetchStats()
    },[])

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Error",
            description: "No token found.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const data = await getCurrrentSchool(token);
        setSchool(data.school || null);
        if (data.school) {
          setSchoolName(data.school.name);
          setAddress(data.school.address);
          setDistrict(data.school.district);
          setState(data.school.state || "AL");
          setCountry(data.school.country || "United States");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch school data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [toast]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!schoolName.trim()) {
      newErrors.schoolName = "School name is required";
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!logo && !isEditing) {
      newErrors.logo = "Logo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Error",
            description: "You are not authenticated.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("name", schoolName);
        formData.append("address", address);
        formData.append("district", district);
        formData.append("state", state);
        formData.append("country", country);
        if (logo) {
          formData.append("logo", logo);
        }
        const response = isEditing
    ? await updateSchool(formData, school._id, token)
    : await addSchool(formData, token);


if (!response.error) {
    toast({
        title: isEditing
            ? "School updated successfully"
            : "School added successfully",
        description: `${schoolName} has been ${
            isEditing ? "updated" : "added"
        } to the system.`,
    });
    setLoading(false);
    setSchool(response.data.school);
    setIsEditing(false);
    navigate("/analytics");
  } else {
    toast({
      title: "Error",
      description: "Failed to process the request. Please try again.",
      variant: "destructive",
      });
    }
    setLoading(false);
  }
  };

  const resetStudent = async ()=>{ 
    try{
      await resetStudentRoster()
      setShowResetModal(false)
      toast({
        title: "Success",
        description: `Student Roster Reset Successfully`,
      })
    }catch(e){
      console.log("Error",e);
    }
}

  const formFields = (
    <>
      <div>
        <Label htmlFor="state">State</Label>
        <Select
          value={state}
          onValueChange={setState}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {STATE_OPTIONS.map((stateOption) => (
              <SelectItem key={stateOption} value={stateOption}>
                {stateOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
        />
      </div>
    </>
  );

  if (loading) return <Loading />;

  if (school) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-8 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-1 items-start">
            {/* School Logo Section */}
            <div className="flex flex-col items-center space-y-4">
              <img
                src={school.logo || "/default-logo.png"}
                alt={school.name}
                className="w-64 h-64 object-cover rounded-lg shadow-lg"
              />
              <div className="flex items-center gap-4 mt-6">
                <Button 
                  variant={"outline"} 
                  className="bg-[#00a58c] hover:bg-[#00a58c]/90 text-white" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit School"}
                </Button>
                <Button 
                  variant={"outline"} 
                  className="bg-red-500 hover:bg-red-700 text-white hover:text-white" 
                  onClick={() => setShowResetModal(true)}
                >
                  Reset Students
                </Button>
              </div>
            </div>

            {/* School Info Section */}
            <div className="flex flex-col space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-4xl font-bold text-gray-800 mb-2">{school.name}</h2>
                <p className="text-xl text-[#00a58c] font-semibold">{school.district}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-medium text-gray-700">
                  Lead Teacher: <span className="text-gray-600">{school.createdBy.name?.toUpperCase()}</span>
                </p>
                <div className="text-lg text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="material-icons">location_on</span>
                    {school.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-icons">public</span>
                    {school.state}, {school.country}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="mt-8 space-y-8">
            <SchoolStats stats={stats} />
            <AllCharts />
          </div>
        )}

        {/* Rest of the editing form */}
        {isEditing && (
          <div className="w-full mt-8">
            <div className="bg-white shadow-xl p-8 rounded-lg max-w-3xl mx-auto">
              <div className="border-b pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                  Edit School Information
                </h1>
                <p className="text-gray-600 mt-2">Update your school's details below</p>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <Label htmlFor="schoolName" className="text-gray-700 font-medium">School Name</Label>
                  <Input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="mt-1 w-full"
                    required
                  />
                  {errors.schoolName && (
                    <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="district" className="text-gray-700 font-medium">District</Label>
                  <Input
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="mt-1 w-full"
                    required
                  />
                  {errors.district && (
                    <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address" className="text-gray-700 font-medium">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 w-full"
                    required
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="text-gray-700 font-medium">State</Label>
                  <Select
                    value={state}
                    onValueChange={setState}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_OPTIONS.map((stateOption) => (
                        <SelectItem key={stateOption} value={stateOption}>
                          {stateOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-700 font-medium">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="logo" className="text-gray-700 font-medium">School Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    onChange={(e) => setLogo(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="mt-1 w-full"
                  />
                  {errors.logo && (
                    <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
                  )}
                </div>

                <div className="col-span-2 flex justify-end gap-4 mt-6 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#00a58c] hover:bg-[#00a58c]/90 text-white"
                  >
                    Update School
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        <Modal
        isOpen={showResetModal}
        description="Are you sure you want to reset the student roster?"
        title="Add School"
        onClose={()=>{
          setShowResetModal(false)
        }}
        onConfirm={()=>{
          resetStudent()
        }}
        callToAction="Reset"
      />
      </div>
    );
  }
  return (
    <div className="grid  place-items-center w-full h-full mt-20">
      <div className=" shadow-xl p-4 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">
          {isEditing ? "Edit School" : "Add School"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
            />
            {errors.schoolName && (
              <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>
          <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                  />
                  {errors.district && (
                    <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                  )}
                </div>
          {formFields}
          {!isEditing && (
            <div>
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                accept="image/*"
              />
              {errors.logo && (
                <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
              )}
            </div>
          )}
          <Button type="submit">
            {isEditing ? "Update School" : "Add School"}
          </Button>
        </form>
      </div>
      
    </div>
  );
}