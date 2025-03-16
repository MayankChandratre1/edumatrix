import { Button } from "@/components/ui/button"
import EducationYearChart from "./component/new-chart"
import { useEffect, useState } from "react"
import { getCurrrentSchool, getStudents, sendReportImage } from "@/api"
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as htmlToImage from 'html-to-image'
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import ViewReport from "./view-report"
import Modal from "./Modal"

// Add these type declarations
type SelectedStudentData = {
  data: any[];
  feedback: any[];
  totalPoints: {
    eToken: number;
    oopsies: number;
    withdraw: number;
  };
  teacher: any[];
  studentInfo: {
    _id: string; // Added id to help with removal
    name: string;
    grade: string;
    email?: string;
    parentEmail?: string;
    standard?: string;
  };
}[];

// Add this component at the top of the file, before the Finalize component
const LoadingModal = ({ isOpen, progress }: { isOpen: boolean, progress: number }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-[500px] shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Generating Reports</h2>
        <Progress value={progress} className="w-full mb-4 h-2" />
        <div className="text-center space-y-2">
          <p className="text-gray-600">
            Reports are being generated and will be sent to your email shortly.
          </p>
          <p className="font-semibold text-[#00a58c]">
            Progress: {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
};

const Finalize = () => {
  const [studentId, setStudentId] = useState<string>("")
  const [__, setStudents] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [schoolData, setSchoolData] = useState<any>({})
  const [selectedStudentsData, setSelectedStudentsData] = useState<SelectedStudentData>([])
  const [progress, setProgress] = useState(0)
  const [resetting, setResetting] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [_, setGeneratedPDFs] = useState<{ fileName: string, pdf: jsPDF, toTeacher: string }[]>([])
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


  const generateRewardPDF = async (student: any) => {
    const barChart = document.getElementById('graph')
    if (barChart) {
      const src = await htmlToImage.toPng(barChart)
      const formdata = new FormData();
      // Convert image data URL to Blob
      const imageBlob = await (await fetch(src)).blob();
      formdata.append('file', imageBlob, 'chart.png');
      
      // Stringify objects before appending
      formdata.append('studentData', JSON.stringify(student));
      formdata.append('schoolData', JSON.stringify(schoolData));
      formdata.append('teacherData', JSON.stringify(student.teacher[0]));
      
      await sendReportImage(formdata, student.teacher[0].email || "");
    }
    
  }

  const generateAllReports = async () => {
    setIsGenerating(true)
    setProgress(0)
    setGeneratedPDFs([])
    setShowModal(false)
  
    try {
      for (let i = 0; i < selectedStudentsData.length; i++) {
        // Update student ID and wait for chart to update
        setStudentId(selectedStudentsData[i].studentInfo._id)
        await delay(2000) // Wait for chart to update
  
        // Generate PDF
        await generateRewardPDF(selectedStudentsData[i])
        setProgress(((i + 1) / selectedStudentsData.length) * 100)
      }
      setIsGenerating(false)
      setProgress(0)
      toast({
        title: "Success",
        description: `Generated ${selectedStudentsData.length} reports successfully`,
      })
    } catch (error) {
      console.error('Error sending report:', error);
      toast({
        title: "Error",
        description: `Failed to send reports`,
        variant: "destructive"
      });
    }
   }
   
  



 

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token")
      const resTeacher = await getStudents(token ?? "")
      const school = await getCurrrentSchool(token ?? "")      
      setStudents(resTeacher.students)
      setSchoolData(school)
    }
    fetchData()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-gray-800">
          School Year Reports
        </h1>
        <p className="text-gray-600 text-lg">
          Generate and email reports for all selected students
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
        {/* Information Note */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <p className="text-blue-700 text-sm">
            <span className="font-semibold">Note:</span> After clicking "Email Reports", 
            individual reports will be generated and sent to your email. This process may 
            take a few moments depending on the number of students selected.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button 
            className={`bg-[#00a58c] hover:bg-[#00a58c]/90 text-white px-6 py-2 h-auto
              ${(isGenerating || selectedStudentsData.length === 0 || resetting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setShowModal(true)}
            disabled={isGenerating || selectedStudentsData.length === 0 || resetting}
          >
            <div className="flex items-center gap-2">
              <span>
                {isGenerating ? 'Generating...' : `Email Reports (${selectedStudentsData.length})`}
              </span>
            </div>
          </Button>

          <Button 
            variant="destructive"
            className={`px-6 py-2 h-auto ${(isGenerating || resetting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isGenerating || resetting}
            onClick={() => {
              setResetting(true);
              setSelectedStudentsData([]);
              setSelectedStudents(new Set());
              setResetting(false);
            }}
          >
            <div className="flex items-center gap-2">
              <span>{resetting ? 'Cancelling...' : 'Cancel Selection'}</span>
            </div>
          </Button>
        </div>

        {/* Student Selection View */}
        <div className="mt-8">
          <ViewReport 
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
            setSelectedStudentsData={setSelectedStudentsData}
            selectedStudentsData={selectedStudentsData}
          />
        </div>
      </div>

      {/* Hidden Chart */}
      <div className="opacity-0">
        <EducationYearChart slimLines studentId={studentId} />
      </div>

      {/* Modals */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => generateAllReports()}
        title="Email Reports"
        description={`You are about to email ${selectedStudentsData.length} reports to your email. Are you sure you want to proceed?`}
        callToAction='Confirm'
      />

      <LoadingModal isOpen={isGenerating} progress={progress} />
    </div>
  )
}

export default Finalize