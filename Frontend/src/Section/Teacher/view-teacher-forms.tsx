import  { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormDetails } from '@/Section/School/component/form-details'
import { CalendarIcon, ClipboardIcon, StarIcon, MinusCircleIcon } from 'lucide-react'
import { getForms } from '@/api'
import { toast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { Form } from '@/lib/types'


export default function ViewTeacherForms() {
  const [forms, setForms] = useState<Form[]>([])
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    // Fetch forms from your API
    const fetchForms = async () => {
      try {
        const data = await getForms(localStorage.getItem('token')!)
        if(data.error){     
          toast({
            title: 'Error',
            description: data.error,
            variant: 'destructive'
          })
        }else{
          setForms(data.forms)
        }
      } catch (error) {
        console.error('Error fetching forms:', error)
      }
    }

    fetchForms()
  }, [])

  const getFormTypeIcon = (formType: string) => {
    switch (formType) {
      case 'AwardPoints':
        return <StarIcon className="h-6 w-6 text-yellow-500" />
      case 'Feedback':
        return <ClipboardIcon className="h-6 w-6 text-blue-500" />
      case 'PointWithdraw':
        return <MinusCircleIcon className="h-6 w-6 text-red-500" />
      case 'DeductPoints':
        return <MinusCircleIcon className="h-6 w-6 text-orange-500" />
      default:
        return <ClipboardIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const FormCard = ({ form }: { form: Form }) => (
    <Card className="flex flex-col h-full transform transition-all duration-200 hover:scale-[1.02] bg-white border shadow-md hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold line-clamp-1">{form.formName}</CardTitle>
          <CardDescription className="text-sm font-medium text-[#00a58c]">
            {form.formType}
          </CardDescription>
        </div>
        <div className='p-2 bg-gray-50 rounded-full'>{getFormTypeIcon(form.formType)}</div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{new Date(form.createdAt).toLocaleDateString()}</span>
        </div>
        <Button
          className="w-full mt-4 bg-[#00a58c] hover:bg-[#00a58c]/90 text-white"
          onClick={() => navigate(`/teachers/submitform/${form._id}`)}
        >
          Use Form
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Forms</h1>
          <p className="text-gray-600 mt-1">View and use available forms</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {forms.map((form) => (
          <FormCard key={form._id} form={form} />
        ))}
      </div>

      {selectedForm && (
        <FormDetails form={selectedForm} onClose={() => setSelectedForm(null)} />
      )}
    </div>
  )
}
