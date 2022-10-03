import {
  Button,
  TableBody,
} from "@material-ui/core";
import PaginationMui from '@material-ui/lab/Pagination';
import { FC, useContext, useEffect, useState } from "react";
import { useHistory, useRouteMatch } from "react-router-dom";
import {
  getSupervisions,
} from "../../../actions/moduleActions";
import { ButtonAppBar } from "../../../components/NavBar";
import {
  StyledTableCell,
  StyledTableContainer,
  StyledTableHead,
  StyledTableRow,
} from "../../../components/StyledTable";
import { AuthContext } from "../../../context/context";
import { Supervision } from "../../../models/models";
import { Pagination } from "../../../models/pagination";
import { getPageList, useFormStyles, useValidCheck } from "./Dashboard";

export const Supervisors: FC = () => {
  const match = useRouteMatch();
  const { state } = useContext(AuthContext);
  const [isValid, setIsValid] = useState(false);
  const [supervisions, setSupervisions] = useState<Pagination<Supervision>>({});
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15 //to test
  const [noPagination, setNoPagination] = useState(false)
  const history = useHistory();

  const moduleId: number = useValidCheck(history, state, match, setIsValid);

  const pageList = getPageList(match);

  useEffect(() => {
    if (isValid) {
      if (noPagination) {
        getSupervisions({ moduleId: moduleId }, setSupervisions);
      } else {
        getSupervisions({ moduleId: moduleId, page: page, limit: PAGE_SIZE }, setSupervisions);
      }
    }
  }, [isValid, page, noPagination]);

  const handlePageChange = (event, page) => {
    setPage(page)
  }

  return (
    <div>
      <ButtonAppBar pageList={pageList} currentPage="Supervisors" username= {`${state?.user?.Name}`} colour='orange'/>
      <StyledTableContainer>
        <StyledTableHead>
          <StyledTableCell>ID</StyledTableCell>
          <StyledTableCell>Name</StyledTableCell>
          <StyledTableCell align="right">Email</StyledTableCell>
        </StyledTableHead>
        <TableBody>
          {supervisions.rows?.map((supervision) => {
            return (
              <StyledTableRow key={supervision.Staff.ID}>
                <StyledTableCell component="th" scope="row">
                  {supervision.Staff.ID}
                </StyledTableCell>
                <StyledTableCell component="th" scope="row">
                  {supervision.Staff.Name}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {supervision.Staff.Email}
                </StyledTableCell>
              </StyledTableRow>
            );
          })}
        </TableBody>
      </StyledTableContainer>
      {
        !noPagination && supervisions.totalPages > 1 ?
        <div style={{marginTop: 20, display: 'flex', justifyContent: 'center'}}>
          <PaginationMui count={supervisions.totalPages} page={page} onChange={handlePageChange} variant="outlined" color="primary" />
          <Button color="primary" onClick={()=>{setNoPagination(true)}}>Show full list</Button>
        </div> : null 
      }
    </div>
  );
};